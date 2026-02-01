import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma/prisma.service';

@Injectable()
export class UtilsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserById<T extends Prisma.UserSelect>(
    userId: string,
    select: T
  ): Promise<Prisma.UserGetPayload<{ select: T }> | null> {
    return this.prisma.db.user.findUnique({
      where: { id: userId },
      select,
    });
  }
}
