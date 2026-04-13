import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailConfig } from './email.config';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class ResendAdapter {
  private readonly resend: Resend;
  private readonly logger = new Logger(ResendAdapter.name);

  constructor(private readonly emailConfig: EmailConfig) {
    this.resend = new Resend(this.emailConfig.apiKey);
  }

  async send(options: SendEmailOptions): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.emailConfig.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      throw new Error(`Email send failed: ${error.message}`);
    }
  }
}