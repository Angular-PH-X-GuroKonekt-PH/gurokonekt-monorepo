import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Supabase signs access tokens with either the project's legacy symmetric
 * secret (HS256) or an asymmetric signing key published via JWKS (ES256/RS256).
 * A project can switch between the two at any time from the dashboard, and the
 * staging and production projects do not necessarily run the same key type.
 *
 * Pinning a single algorithm therefore breaks every guarded route the moment a
 * project rotates. The key is instead selected from the token's own header:
 * asymmetric tokens are verified against the project's JWKS (looked up by kid,
 * so key rotation needs no redeploy), symmetric tokens against JWT_SECRET.
 */
const JWKS_PATH = '/auth/v1/.well-known/jwks.json';
const SYMMETRIC_ALGORITHM = 'HS256';

function resolveJwksUri(): string | null {
  const explicitUri = process.env['SUPABASE_JWKS_URI'];
  if (explicitUri) {
    return explicitUri;
  }

  const supabaseUrl = process.env['SUPABASE_URL'];
  return supabaseUrl ? `${supabaseUrl.replace(/\/+$/, '')}${JWKS_PATH}` : null;
}

function decodeHeader(rawJwtToken: unknown): { alg?: string; kid?: string } {
  const [encodedHeader] = String(rawJwtToken).split('.');
  return JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'));
}

@Injectable()
export class JwtGuardStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtGuardStrategy.name);

  constructor(private readonly prisma: PrismaService) {
    const jwksUri = resolveJwksUri();
    const jwks = jwksUri
      ? new jwksRsa.JwksClient({
          jwksUri,
          cache: true,
          cacheMaxAge: 10 * 60 * 1000,
          rateLimit: true,
          jwksRequestsPerMinute: 10,
        })
      : null;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['ES256', 'RS256', SYMMETRIC_ALGORITHM],
      secretOrKeyProvider: (
        _request: unknown,
        rawJwtToken: unknown,
        done: (err: Error | null, secret?: string) => void,
      ) => {
        let header: { alg?: string; kid?: string };
        try {
          header = decodeHeader(rawJwtToken);
        } catch {
          done(new Error('Malformed JWT header'));
          return;
        }

        if (header.alg === SYMMETRIC_ALGORITHM) {
          // Never fall back to a JWKS public key here — the HMAC path must only
          // ever use the private shared secret.
          const secret = process.env['JWT_SECRET'];
          if (!secret) {
            done(new Error('JWT_SECRET is not set but an HS256 token was received'));
            return;
          }
          done(null, secret);
          return;
        }

        if (!jwks) {
          done(new Error('SUPABASE_URL/SUPABASE_JWKS_URI is not set but an asymmetric token was received'));
          return;
        }

        jwks.getSigningKey(header.kid, (err, key) => {
          if (err || !key) {
            done(err ?? new Error(`No JWKS signing key found for kid ${header.kid}`));
            return;
          }
          done(null, key.getPublicKey());
        });
      },
    });

    this.logger.log(
      jwksUri
        ? `JWT verification: JWKS (${jwksUri}) for ES256/RS256, JWT_SECRET for HS256`
        : 'JWT verification: JWT_SECRET (HS256) only — no JWKS URI configured',
    );
  }

  async validate(payload: unknown) {
    const user = payload as {
      sub?: string;
      email?: string;
      role?: string;
    };

    if (!user.sub) {
      this.logger.warn('JWT payload missing sub claim');
      return null;
    }

    const blockedStatuses = ['inactive', 'banned', 'deleted', 'suspended'];

    try {
      const dbUser = await this.prisma.db.user.findUnique({
        where: { id: user.sub },
        select: { status: true, role: true },
      });

      if (!dbUser) {
        this.logger.warn(`User not found in DB: ${user.sub}`);
        return null;
      }

      if (blockedStatuses.includes(dbUser.status)) {
        this.logger.warn(`User ${user.sub} has blocked status: ${dbUser.status}`);
        return null;
      }

      return {
        id: user.sub,
        email: user.email,
        role: dbUser.role,
      };
    } catch (err) {
      this.logger.error(`DB error during JWT validation: ${(err as Error).message}`);
      return null;
    }
  }
}
