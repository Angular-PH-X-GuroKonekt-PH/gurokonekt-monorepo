import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('MailService', () => {
  const sendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
  });

  it('sends a safe booking request email containing the requested booking details', async () => {
    sendMail.mockResolvedValue({ messageId: 'smtp-message-1' });
    const service = new MailService();

    const result = await service.sendBookingCreatedEmail({
      to: 'mentor@example.com',
      mentorFirstName: 'Alex <script>',
      menteeName: 'Jamie & Pat',
      sessionDateTime: new Date('2026-08-28T09:00:00.000Z'),
      timeZone: 'Asia/Manila',
      durationMinutes: 60,
      bookingDetails: 'Discuss <b>career goals</b>',
      reviewUrl: 'https://app.example.com/booking-overview',
    });

    expect(result).toEqual({ messageId: 'smtp-message-1' });
    const message = sendMail.mock.calls[0][0];
    expect(message.to).toBe('mentor@example.com');
    expect(message.subject).toContain('Jamie & Pat');
    expect(message.html).toContain('Alex &lt;script&gt;');
    expect(message.html).toContain('Jamie &amp; Pat');
    expect(message.html).toContain('August 28, 2026');
    expect(message.html).toContain('5:00 PM');
    expect(message.html).toContain('60 minutes');
    expect(message.html).toContain('Discuss &lt;b&gt;career goals&lt;/b&gt;');
    expect(message.html).toContain('Pending');
    expect(message.html).toContain('https://app.example.com/booking-overview');
    expect(message.html).not.toContain('<script>');
  });

  it('lets SMTP errors reach the delivery logger', async () => {
    sendMail.mockRejectedValue(new Error('SMTP unavailable'));
    const service = new MailService();

    await expect(
      service.sendBookingCreatedEmail({
        to: 'mentor@example.com',
        mentorFirstName: 'Alex',
        menteeName: 'Jamie',
        sessionDateTime: new Date('2026-08-28T09:00:00.000Z'),
        timeZone: 'UTC',
        durationMinutes: null,
        bookingDetails: null,
        reviewUrl: 'https://app.example.com/booking-overview',
      }),
    ).rejects.toThrow('SMTP unavailable');
  });
});
