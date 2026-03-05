import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ALLOWED_CORS_ORIGINS, NotificationInterface } from '@gurokonekt/models';

export const NOTIFICATION_EVENTS = {
  CREATED: 'notification:created',
  UPDATED: 'notification:updated',
  DELETED: 'notification:deleted',
} as const;

@WebSocketGateway({
  cors: {
    origin: ALLOWED_CORS_ORIGINS,
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

  // userId -> socketId mapping for targeted emission.
  private readonly userSocketMap = new Map<string, string>();

  // socketId -> userId reverse mapping for efficient disconnect cleanup.
  private readonly socketUserMap = new Map<string, string>();

  // ====================================================
  // LIFECYCLE
  // ====================================================

  handleConnection(client: Socket): void {
    const userId = client.handshake.query['userId'] as string | undefined;

    if (!userId) {
      this.logger.warn(`WebSocket connected without userId — socketId=${client.id}`);
      return;
    }

    this.userSocketMap.set(userId, client.id);
    this.socketUserMap.set(client.id, userId);
    this.logger.log(`WebSocket connected — userId=${userId}, socketId=${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    const userId = this.socketUserMap.get(client.id);

    if (userId) {
      this.userSocketMap.delete(userId);
      this.socketUserMap.delete(client.id);
      this.logger.log(`WebSocket disconnected — userId=${userId}, socketId=${client.id}`);
    }
  }

  // ====================================================
  // PUBLIC EMIT API
  // ====================================================

  /**
   * Emit a realtime notification event to a specific user.
   *
   * @param userId  - The target user's ID.
   * @param payload - The notification payload (or `{ id }` for delete events).
   * @param event   - Socket event name (use `NOTIFICATION_EVENTS` constants).
   */
  sendNotificationToUser(
    userId: string,
    payload: NotificationInterface | { id: string },
    event: string = NOTIFICATION_EVENTS.UPDATED,
  ): void {
    const socketId = this.userSocketMap.get(userId);

    if (!socketId) {
      this.logger.warn(
        `No active WebSocket for userId=${userId} — skipping emit for event "${event}"`,
      );
      return;
    }

    this.server.to(socketId).emit(event, payload);
    this.logger.log(`Emitted "${event}" to userId=${userId} (socketId=${socketId})`);
  }
}
