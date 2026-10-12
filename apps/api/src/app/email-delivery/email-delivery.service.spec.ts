import { EmailDeliveryStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailDeliveryService } from './email-delivery.service';

describe('EmailDeliveryService', () => {
  const update = jest.fn();
  const sendBookingCreatedEmail = jest.fn();
  const prisma = {
    db: { emailDelivery: { update } },
  } as unknown as PrismaService;
  const mail = { sendBookingCreatedEmail } as unknown as MailService;
  const input = {
    to: 'mentor@example.com',
    mentorFirstName: 'Alex',
    menteeName: 'Jamie',
    sessionDateTime: new Date('2026-08-28T09:00:00.000Z'),
    timeZone: 'UTC',
    durationMinutes: 60,
    bookingDetails: 'Career planning',
    reviewUrl: 'https://app.example.com/booking-overview',
  };

  beforeEach(() => jest.clearAllMocks());

  it('marks a successful SMTP handoff as sent', async () => {
    sendBookingCreatedEmail.mockResolvedValue({ messageId: 'smtp-message-1' });
    update.mockResolvedValue({});

    await new EmailDeliveryService(prisma, mail).sendBookingCreated(
      'delivery-1',
      input,
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 'delivery-1' },
      data: expect.objectContaining({
        status: EmailDeliveryStatus.SENT,
        attemptCount: { increment: 1 },
        providerMessageId: 'smtp-message-1',
        lastError: null,
        sentAt: expect.any(Date),
        attemptedAt: expect.any(Date),
      }),
    });
  });

  it('records an SMTP failure and does not throw to the booking flow', async () => {
    sendBookingCreatedEmail.mockRejectedValue(
      new Error('SMTP\ncredentials unavailable password=super-secret'),
    );
    update.mockResolvedValue({});

    await expect(
      new EmailDeliveryService(prisma, mail).sendBookingCreated(
        'delivery-1',
        input,
      ),
    ).resolves.toBeUndefined();

    expect(update).toHaveBeenCalledWith({
      where: { id: 'delivery-1' },
      data: expect.objectContaining({
        status: EmailDeliveryStatus.FAILED,
        attemptCount: { increment: 1 },
        providerMessageId: null,
        lastError: 'SMTP credentials unavailable password=[REDACTED]',
        sentAt: null,
        attemptedAt: expect.any(Date),
      }),
    });
  });

  it('does not throw if recording the SMTP failure also fails', async () => {
    sendBookingCreatedEmail.mockRejectedValue(new Error('SMTP unavailable'));
    update.mockRejectedValue(new Error('database unavailable'));

    await expect(
      new EmailDeliveryService(prisma, mail).sendBookingCreated(
        'delivery-1',
        input,
      ),
    ).resolves.toBeUndefined();
  });
});
