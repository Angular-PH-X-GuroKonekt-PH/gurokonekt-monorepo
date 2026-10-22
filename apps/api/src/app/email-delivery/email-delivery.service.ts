import { Injectable, Logger } from '@nestjs/common';
import { EmailDeliveryStatus } from '@prisma/client';
import type {
  BookingAcceptedEmailInput,
  BookingCreatedEmailInput,
  BookingRejectedEmailInput,
  BookingRescheduledEmailInput,
} from '../mail/booking-email.interface';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailDeliveryService {
  private readonly logger = new Logger(EmailDeliveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async sendBookingCreated(
    deliveryId: string,
    input: BookingCreatedEmailInput,
  ): Promise<void> {
    await this.sendAndTrack(deliveryId, () =>
      this.mail.sendBookingCreatedEmail(input),
    );
  }

  async sendBookingAccepted(
    deliveryId: string,
    input: BookingAcceptedEmailInput,
  ): Promise<void> {
    await this.sendAndTrack(deliveryId, () =>
      this.mail.sendBookingAcceptedEmail(input),
    );
  }

  async sendBookingRejected(
    deliveryId: string,
    input: BookingRejectedEmailInput,
  ): Promise<void> {
    await this.sendAndTrack(deliveryId, () =>
      this.mail.sendBookingRejectedEmail(input),
    );
  }

  async sendBookingRescheduled(
    deliveryId: string,
    input: BookingRescheduledEmailInput,
  ): Promise<void> {
    await this.sendAndTrack(deliveryId, () =>
      this.mail.sendBookingRescheduledEmail(input),
    );
  }

  private async sendAndTrack(
    deliveryId: string,
    sendEmail: () => Promise<{ messageId?: unknown }>,
  ): Promise<void> {
    const attemptedAt = new Date();
    let result: { messageId?: unknown };

    try {
      result = await sendEmail();
    } catch (error) {
      await this.recordFailure(deliveryId, attemptedAt, error);
      return;
    }

    try {
      await this.prisma.db.emailDelivery.update({
        where: { id: deliveryId },
        data: {
          status: EmailDeliveryStatus.SENT,
          attemptCount: { increment: 1 },
          providerMessageId:
            result.messageId === undefined ? null : String(result.messageId),
          lastError: null,
          attemptedAt,
          sentAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(
        `Email was accepted by SMTP, but delivery ${deliveryId} could not be marked sent: ${this.errorMessage(error)}`,
      );
    }
  }

  private async recordFailure(
    deliveryId: string,
    attemptedAt: Date,
    error: unknown,
  ): Promise<void> {
    const lastError = this.errorMessage(error);

    try {
      await this.prisma.db.emailDelivery.update({
        where: { id: deliveryId },
        data: {
          status: EmailDeliveryStatus.FAILED,
          attemptCount: { increment: 1 },
          providerMessageId: null,
          lastError,
          attemptedAt,
          sentAt: null,
        },
      });
    } catch (updateError) {
      this.logger.error(
        `Email delivery ${deliveryId} failed and its log could not be updated: ${this.errorMessage(updateError)}`,
      );
      return;
    }

    this.logger.error(`Email delivery ${deliveryId} failed: ${lastError}`);
  }

  private errorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message
      .replace(/[\r\n]+/g, ' ')
      .replace(
        /\b(password|passwd|secret|token|authorization)\b\s*[:=]\s*\S+/gi,
        '$1=[REDACTED]',
      )
      .slice(0, 1000);
  }
}
