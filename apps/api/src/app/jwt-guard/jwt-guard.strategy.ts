import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtGuardStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://utsktclxlwtjedrhqtuh.supabase.co/auth/v1/.well-known/jwks.json',
      }),
      algorithms: ['ES256'],
    });
  }

  async validate(payload: unknown) {
    const user = payload as {
      sub?: string;
      email?: string;
      role?: string;
    };

    const blockedStatuses = ['inactive', 'banned', 'deleted', 'suspended'];
    const dbUser = await this.prisma.db.user.findUnique({
      where: { id: user.sub },
      select: { status: true },
    });

    if (!dbUser || blockedStatuses.includes(dbUser.status)) {
      return null;
    }

    return {
      id: user.sub,
      email: user.email,
      role: user.role,
    };
  }
}
