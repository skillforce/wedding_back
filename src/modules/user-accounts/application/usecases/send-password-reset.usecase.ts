import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { ConfirmationRepository } from '../../infra/confirmation.repository';
import { ConfirmationType } from '../../domain/entities/confirmation.entity';
import { ResendAdapter } from '../../../email/resend.adapter';
import {
  passwordResetEmailTemplate,
  getPasswordResetEmailSubject,
  Locale,
} from '../../../email/templates/password-reset-email.template';
import { UserAccountsConfig } from '../../config/user-accounts.config';

export class SendPasswordResetCommand {
  constructor(
    public readonly userId: number,
    public readonly email: string,
    public readonly login: string,
    public readonly locale: Locale = 'en',
  ) {}
}

@CommandHandler(SendPasswordResetCommand)
export class SendPasswordResetUseCase
  implements ICommandHandler<SendPasswordResetCommand, void>
{
  constructor(
    private readonly confirmationRepository: ConfirmationRepository,
    private readonly resendAdapter: ResendAdapter,
    private readonly userAccountsConfig: UserAccountsConfig,
  ) {}

  async execute({ userId, email, login, locale }: SendPasswordResetCommand): Promise<void> {
    await this.confirmationRepository.invalidateAllForUser(userId, ConfirmationType.PASSWORD_RESET);

    const token = randomUUID();
    await this.confirmationRepository.save({
      userId,
      token,
      email,
      type: ConfirmationType.PASSWORD_RESET,
      expiresAt: new Date(Date.now() + this.userAccountsConfig.confirmationTokenTtlMs),
      confirmedAt: null,
    });

    void this.sendResetEmail(email, login, token, locale);
  }

  private async sendResetEmail(
    email: string,
    login: string,
    token: string,
    locale: Locale,
  ): Promise<void> {
    const resetUrl = `${this.userAccountsConfig.feUrl}/reset-password?token=${token}`;
    await this.resendAdapter.send({
      to: email,
      subject: getPasswordResetEmailSubject(locale),
      html: passwordResetEmailTemplate(resetUrl, login, locale),
    });
  }
}