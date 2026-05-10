import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LogsActionType } from '@gurokonekt/models';

export interface LogInput {
  actionType: LogsActionType;
  targetId: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdById?: string;
}

/**
 * Centralized logging for all auth operations
 */
@Injectable()
export class AuthLoggingService {
  private readonly logger = new Logger(AuthLoggingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: LogInput): Promise<void> {
    try {
      await this.prisma.db.logs.create({
        data: {
          actionType: input.actionType,
          targetId: input.targetId,
          details: input.details,
          metadata: input.metadata || {},
          ipAddress: input.ipAddress || '',
          userAgent: input.userAgent || '',
          createdById: input.createdById || null,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create log entry', error);
    }
  }

  async getFailedAttemptCount(
    actionType: LogsActionType,
    identifier: string,
    metadataKey: string = 'email',
    timeWindowMs: number = 86400000 // 24 hours
  ): Promise<number> {
    const timeStart = new Date(Date.now() - timeWindowMs);
    const timeEnd = new Date();

    return this.prisma.db.logs.count({
      where: {
        actionType,
        metadata: { path: [metadataKey], equals: identifier },
        createdAt: { gte: timeStart, lte: timeEnd },
      },
    });
  }

  async getLastAttempt(
    actionType: LogsActionType,
    identifier: string,
    metadataKey: string = 'email'
  ) {
    return this.prisma.db.logs.findFirst({
      where: {
        actionType,
        metadata: { path: [metadataKey], equals: identifier },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRecentLog(
    actionType: LogsActionType,
    identifier: string,
    timeWindowMs: number,
    metadataKey: string = 'email'
  ) {
    const timeThreshold = new Date(Date.now() - timeWindowMs);
    return this.prisma.db.logs.findFirst({
      where: {
        actionType,
        metadata: { path: [metadataKey], equals: identifier },
        createdAt: { gte: timeThreshold },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
