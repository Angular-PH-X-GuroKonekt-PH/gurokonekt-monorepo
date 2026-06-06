import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor() {
    this.from = process.env['SMTP_FROM'] ?? 'Gurokonekt <no-reply@gurokonekt.com>';

    if (!process.env['SMTP_USER'] || !process.env['SMTP_PASS']) {
      this.logger.warn('SMTP_USER or SMTP_PASS is not set — emails will not be delivered');
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
      this.logger.error(`Failed to send approval email to ${to}: ${error.message}`, error.stack);
    }
  }

  async sendMentorRejectionEmail(to: string, firstName: string, reason: string): Promise<void> {
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
      this.logger.error(`Failed to send rejection email to ${to}: ${error.message}`, error.stack);
    }
  }

  async sendMentorDeactivationEmail(to: string, firstName: string): Promise<void> {
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
}
