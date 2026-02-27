import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

@Injectable()
export class JwtGuardStrategy extends PassportStrategy(Strategy) {
  constructor() {
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

    return {
      id: user.sub,
      email: user.email,
      role: user.role,
    };
  }
}
