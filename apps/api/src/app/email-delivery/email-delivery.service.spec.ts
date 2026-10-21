import { EmailDeliveryStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailDeliveryService } from './email-delivery.service';

describe('EmailDeliveryService', () => {
  const update = jest.fn();
  const sendBookingCreatedEmail = jest.fn();
  const sendBookingAcceptedEmail = jest.fn();
  const sendBookingRejectedEmail = jest.fn();
  const sendBookingRescheduledEmail = jest.fn();
  const prisma = {
    db: { emailDelivery: { update } },
  } as unknown as PrismaService;
  const mail = {
    sendBookingCreatedEmail,
    sendBookingAcceptedEmail,
    sendBookingRejectedEmail,
    sendBookingRescheduledEmail,
  } as unknown as MailService;
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

  it('sends an accepted email and marks its delivery as sent', async () => {
    sendBookingAcceptedEmail.mockResolvedValue({
      messageId: 'accepted-message-1',
    });
    update.mockResolvedValue({});
    const acceptedInput = {
      to: 'mentee@example.com',
      menteeFirstName: 'Jamie',
      mentorName: 'Alex Mentor',
      sessionDateTime: input.sessionDateTime,
      timeZone: 'UTC',
      bookingDetails: 'Career planning',
      sessionLink: 'https://meet.example.com/session-1',
      reviewUrl: input.reviewUrl,
    };

    await new EmailDeliveryService(prisma, mail).sendBookingAccepted(
      'accepted-delivery-1',
      acceptedInput,
    );

    expect(sendBookingAcceptedEmail).toHaveBeenCalledWith(acceptedInput);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'accepted-delivery-1' },
      data: expect.objectContaining({
        status: EmailDeliveryStatus.SENT,
        providerMessageId: 'accepted-message-1',
      }),
    });
  });

  it('records a declined email SMTP failure without throwing', async () => {
    sendBookingRejectedEmail.mockRejectedValue(new Error('SMTP unavailable'));
    update.mockResolvedValue({});
    const rejectedInput = {
      to: 'mentee@example.com',
      menteeFirstName: 'Jamie',
      mentorName: 'Alex Mentor',
      sessionDateTime: input.sessionDateTime,
      timeZone: 'UTC',
      bookingDetails: null,
      declineReason: 'Unavailable',
      reviewUrl: input.reviewUrl,
    };

    await expect(
      new EmailDeliveryService(prisma, mail).sendBookingRejected(
        'rejected-delivery-1',
        rejectedInput,
      ),
    ).resolves.toBeUndefined();

    expect(sendBookingRejectedEmail).toHaveBeenCalledWith(rejectedInput);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'rejected-delivery-1' },
      data: expect.objectContaining({
        status: EmailDeliveryStatus.FAILED,
        lastError: 'SMTP unavailable',
      }),
    });
  });

  it('sends a reschedule email and marks its delivery as sent', async () => {
    sendBookingRescheduledEmail.mockResolvedValue({
      messageId: 'rescheduled-message-1',
    });
    update.mockResolvedValue({});
    const rescheduledInput = {
      to: 'mentee@example.com',
      menteeFirstName: 'Jamie',
      mentorName: 'Alex Mentor',
      previousSessionDateTime: new Date('2026-08-28T09:00:00.000Z'),
      newSessionDateTime: new Date('2026-08-29T10:30:00.000Z'),
      timeZone: 'UTC',
      bookingDetails: 'Career planning',
      bookingStatus: 'APPROVED',
      reviewUrl: input.reviewUrl,
    };

    await new EmailDeliveryService(prisma, mail).sendBookingRescheduled(
      'rescheduled-delivery-1',
      rescheduledInput,
    );

    expect(sendBookingRescheduledEmail).toHaveBeenCalledWith(rescheduledInput);
    expect(update).toHaveBeenCalledWith({
      where: { id: 'rescheduled-delivery-1' },
      data: expect.objectContaining({
        status: EmailDeliveryStatus.SENT,
        providerMessageId: 'rescheduled-message-1',
      }),
    });
  });
});
