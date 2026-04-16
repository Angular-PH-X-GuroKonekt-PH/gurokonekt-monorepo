import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtGuardStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtGuardStrategy.name);

  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: (
        _request: unknown,
        _rawJwtToken: unknown,
        done: (err: Error | null, secret?: string) => void,
      ) => {
        const secret = process.env['JWT_SECRET'];
        if (!secret) {
          done(new Error('JWT_SECRET environment variable is not set'));
          return;
        }
        done(null, secret);
      },
      algorithms: ['HS256'],
    });
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
        select: { status: true },
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
        role: user.role,
      };
    } catch (err) {
      this.logger.error(`DB error during JWT validation: ${(err as Error).message}`);
      return null;
    }
  }
}
