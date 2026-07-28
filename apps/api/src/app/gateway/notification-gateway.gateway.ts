import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  isAllowedOrigin,
  NotificationInterface,
  UserStatus,
} from '@gurokonekt/models';
import { Server, Socket } from 'socket.io';

import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';

export const NOTIFICATION_EVENTS = {
  CREATED: 'notification:created',
  UPDATED: 'notification:updated',
  DELETED: 'notification:deleted',
} as const;

@WebSocketGateway({
  cors: {
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = this.getAccessToken(client);

    if (!token) {
      this.logger.warn(
        `Rejected unauthenticated WebSocket — socketId=${client.id}`,
      );
      client.disconnect(true);
      return;
    }

    try {
      const { data, error } = await this.supabase.client.auth.getUser(token);
      const userId = data.user?.id;

      if (error || !userId) {
        this.logger.warn(
          `Rejected invalid WebSocket token — socketId=${client.id}`,
        );
        client.disconnect(true);
        return;
      }

      const user = await this.prisma.db.user.findUnique({
        where: { id: userId },
        select: { status: true },
      });
      const blockedStatuses: UserStatus[] = [
        UserStatus.Inactive,
        UserStatus.Banned,
        UserStatus.Deleted,
        UserStatus.Suspended,
      ];

      if (!user || blockedStatuses.includes(user.status as UserStatus)) {
        this.logger.warn(
          `Rejected WebSocket for unavailable user — userId=${userId}`,
        );
        client.disconnect(true);
        return;
      }

      client.data['userId'] = userId;
      await client.join(this.getUserRoom(userId));
      this.logger.log(
        `WebSocket connected — userId=${userId}, socketId=${client.id}`,
      );
    } catch (error) {
      this.logger.warn(
        `WebSocket authentication failed — socketId=${client.id}: ${
          (error as Error).message
        }`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data['userId'] as string | undefined;

    if (userId) {
      this.logger.log(
        `WebSocket disconnected — userId=${userId}, socketId=${client.id}`,
      );
    }
  }

  sendNotificationToUser(
    userId: string,
    payload: NotificationInterface | { id: string },
    event: string = NOTIFICATION_EVENTS.UPDATED,
  ): void {
    this.server.to(this.getUserRoom(userId)).emit(event, payload);
    this.logger.log(`Emitted "${event}" to userId=${userId}`);
  }

  private getAccessToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.['token'];
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken;
    }

    const authorization = client.handshake.headers.authorization;
    if (
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
    ) {
      return authorization.slice('Bearer '.length);
    }

    return null;
  }

  private getUserRoom(userId: string): string {
    return `notifications:${userId}`;
  }
}
