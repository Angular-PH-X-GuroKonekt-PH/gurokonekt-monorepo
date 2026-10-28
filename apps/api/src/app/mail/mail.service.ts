import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type {
  BookingAcceptedEmailInput,
  BookingCreatedEmailInput,
  BookingRejectedEmailInput,
  BookingRescheduledEmailInput,
} from './booking-email.interface';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor() {
    this.from =
      process.env['SMTP_FROM'] ?? 'Gurokonekt <no-reply@gurokonekt.com>';

    if (!process.env['SMTP_USER'] || !process.env['SMTP_PASS']) {
      this.logger.warn(
        'SMTP_USER or SMTP_PASS is not set — emails will not be delivered',
      );
    }

    this.transporter = nodemailer.createTransport({
      host: process.env['SMTP_HOST'] ?? 'smtp.gmail.com',
      port: Number(process.env['SMTP_PORT'] ?? 587),
      secure: false,
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS'],
      },
    });
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async sendBookingCreatedEmail(
    input: BookingCreatedEmailInput,
  ): Promise<nodemailer.SentMessageInfo> {
    const requestedSchedule = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: input.timeZone,
    }).format(input.sessionDateTime);
    const duration = input.durationMinutes
      ? `<p><strong>Duration:</strong> ${input.durationMinutes} minutes</p>`
      : '';
    const details = input.bookingDetails
      ? `<p><strong>Booking details:</strong> ${this.escapeHtml(input.bookingDetails)}</p>`
      : '';

    return this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: `New Booking Request from ${input.menteeName}`,
      html: `
        <p>Hi ${this.escapeHtml(input.mentorFirstName)},</p>
        <p>${this.escapeHtml(input.menteeName)} has requested a mentoring session with you.</p>
        <p><strong>Requested schedule:</strong> ${this.escapeHtml(requestedSchedule)}</p>
        ${duration}
        ${details}
        <p><strong>Current status:</strong> Pending</p>
        <p>
          <a href="${this.escapeHtml(input.reviewUrl)}">
            Review booking
          </a>
        </p>
        <p>— The Gurokonekt Team</p>
      `,
    });
  }

  async sendBookingAcceptedEmail(
    input: BookingAcceptedEmailInput,
  ): Promise<nodemailer.SentMessageInfo> {
    const confirmedSchedule = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: input.timeZone,
    }).format(input.sessionDateTime);
    const details = input.bookingDetails
      ? `<p><strong>Booking details:</strong> ${this.escapeHtml(input.bookingDetails)}</p>`
      : '';

    return this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: 'Your Booking Request Was Accepted',
      html: `
        <p>Hi ${this.escapeHtml(input.menteeFirstName)},</p>
        <p>${this.escapeHtml(input.mentorName)} accepted your booking request.</p>
        <p><strong>Confirmed schedule:</strong> ${this.escapeHtml(confirmedSchedule)}</p>
        ${details}
        <p><strong>Current status:</strong> Accepted</p>
        <p><strong>Session link:</strong> <a href="${this.escapeHtml(input.sessionLink)}">Join session</a></p>
        <p><a href="${this.escapeHtml(input.reviewUrl)}">View booking</a></p>
        <p>— The Gurokonekt Team</p>
      `,
    });
  }

  async sendBookingRejectedEmail(
    input: BookingRejectedEmailInput,
  ): Promise<nodemailer.SentMessageInfo> {
    const requestedSchedule = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: input.timeZone,
    }).format(input.sessionDateTime);
    const details = input.bookingDetails
      ? `<p><strong>Booking details:</strong> ${this.escapeHtml(input.bookingDetails)}</p>`
      : '';
    const reason = input.declineReason
      ? `<p><strong>Reason:</strong> ${this.escapeHtml(input.declineReason)}</p>`
      : '';

    return this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: 'Your Booking Request Was Declined',
      html: `
        <p>Hi ${this.escapeHtml(input.menteeFirstName)},</p>
        <p>${this.escapeHtml(input.mentorName)} declined your booking request.</p>
        <p><strong>Requested schedule:</strong> ${this.escapeHtml(requestedSchedule)}</p>
        ${details}
        ${reason}
        <p><strong>Current status:</strong> Declined</p>
        <p><a href="${this.escapeHtml(input.reviewUrl)}">View booking</a></p>
        <p>— The Gurokonekt Team</p>
      `,
    });
  }

  async sendBookingRescheduledEmail(
    input: BookingRescheduledEmailInput,
  ): Promise<nodemailer.SentMessageInfo> {
    const formatSchedule = (value: Date) =>
      new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: input.timeZone,
      }).format(value);
    const previousSchedule = formatSchedule(input.previousSessionDateTime);
    const newSchedule = formatSchedule(input.newSessionDateTime);
    const details = input.bookingDetails
      ? `<p><strong>Booking details:</strong> ${this.escapeHtml(input.bookingDetails)}</p>`
      : '';
    const status =
      input.bookingStatus.charAt(0).toUpperCase() +
      input.bookingStatus.slice(1).toLowerCase();

    return this.transporter.sendMail({
      from: this.from,
      to: input.to,
      subject: 'Your Booking Schedule Changed',
      html: `
        <p>Hi ${this.escapeHtml(input.menteeFirstName)},</p>
        <p>${this.escapeHtml(input.mentorName)} changed your booking schedule.</p>
        <p><strong>Previous schedule:</strong> ${this.escapeHtml(previousSchedule)}</p>
        <p><strong>New schedule:</strong> ${this.escapeHtml(newSchedule)}</p>
        ${details}
        <p><strong>Current status:</strong> ${this.escapeHtml(status)}</p>
        <p><a href="${this.escapeHtml(input.reviewUrl)}">View booking</a></p>
        <p>— The Gurokonekt Team</p>
      `,
    });
  }

  async sendMentorApprovalEmail(to: string, firstName: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Your Mentor Application Has Been Approved',
        html: `
          <p>Hi ${this.escapeHtml(firstName)},</p>
          <p>Congratulations! Your mentor application on Gurokonekt has been approved.</p>
          <p>You can now log in and start accepting mentees.</p>
          <p>Welcome to the team!</p>
          <p>— The Gurokonekt Team</p>
        `,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to send approval email to ${to}: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendMentorRejectionEmail(
    to: string,
    firstName: string,
    reason: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Update on Your Mentor Application',
        html: `
          <p>Hi ${this.escapeHtml(firstName)},</p>
          <p>Thank you for applying to become a mentor on Gurokonekt.</p>
          <p>After reviewing your application, we are unable to approve your account at this time.</p>
          <p><strong>Reason:</strong> ${this.escapeHtml(reason)}</p>
          <p>If you have questions, please contact our support team.</p>
          <p>— The Gurokonekt Team</p>
        `,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to send rejection email to ${to}: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendMentorDeactivationEmail(
    to: string,
    firstName: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Your Mentor Account Has Been Deactivated',
        html: `
          <p>Hi ${this.escapeHtml(firstName)},</p>
          <p>Your mentor account on Gurokonekt has been deactivated by an administrator.</p>
          <p>If you believe this is a mistake, please contact our support team.</p>
          <p>— The Gurokonekt Team</p>
        `,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to send deactivation email to ${to}: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendAccountDeactivationEmail(
    to: string,
    firstName: string,
    deactivationUrl: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Confirm Your Account Deactivation',
        html: `
          <p>Hi ${this.escapeHtml(firstName)},</p>
          <p>We received a request to deactivate your Gurokonekt account.</p>
          <p>If you made this request, click the button below to continue:</p>
          <p>
            <a
              href="${this.escapeHtml(deactivationUrl)}"
              style="display:inline-block;padding:12px 20px;background:#f97316;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;"
            >
              Deactivate my account
            </a>
          </p>
          <p>This link expires in 24 hours. Your account will not be deactivated until you submit the reason on the confirmation page.</p>
          <p>If you did not request this, you can safely ignore this email.</p>
          <p>-- The Gurokonekt Team</p>
        `,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to send account deactivation email to ${to}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
