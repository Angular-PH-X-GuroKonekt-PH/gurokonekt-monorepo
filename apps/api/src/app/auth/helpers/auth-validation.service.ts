import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import bcrypt from 'bcrypt';

/**
 * Centralized validation logic for auth operations
 */
@Injectable()
export class AuthValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async userExists(email: string): Promise<boolean> {
    const user = await this.prisma.db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });
    return !!user;
  }

  async phoneExists(phone: string): Promise<boolean> {
    if (!phone) return false;
    const user = await this.prisma.db.user.findUnique({
      where: { phoneNumber: phone },
      select: { id: true },
    });
    return !!user;
  }

  async getUserByEmail(email: string) {
    return this.prisma.db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async getUserById(userId: string) {
    return this.prisma.db.user.findUnique({
      where: { id: userId },
    });
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string, rounds = 10): Promise<string> {
    return bcrypt.hash(password, rounds);
  }

  normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  validatePasswordMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }
}
