import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { EmailConfirmationRepository } from '../../infra/email-confirmation.repository';
import { ResendAdapter } from '../../../email/resend.adapter';
import {
  confirmationEmailTemplate,
  getConfirmationEmailSubject,
  Locale,
} from '../../../email/templates/confirmation-email.template';
import { UserAccountsConfig } from '../../config/user-accounts.config';

export class SendEmailConfirmationCommand {
  constructor(
    public readonly userId: number,
    public readonly email: string,
    public readonly login: string,
    public readonly locale: Locale = 'en',
  ) {}
}

@CommandHandler(SendEmailConfirmationCommand)
export class SendEmailConfirmationUseCase implements ICommandHandler<
  SendEmailConfirmationCommand,
  void
> {
  constructor(
    private readonly emailConfirmationRepository: EmailConfirmationRepository,
    private readonly resendAdapter: ResendAdapter,
    private readonly userAccountsConfig: UserAccountsConfig,
  ) {}

  async execute({
    userId,
    email,
    login,
    locale,
  }: SendEmailConfirmationCommand): Promise<void> {
    await this.emailConfirmationRepository.invalidateAllForUser(userId);

    const token = randomUUID();
    await this.emailConfirmationRepository.save({
      userId,
      token,
      email,
      expiresAt: new Date(
        Date.now() + this.userAccountsConfig.confirmationTokenTtlMs,
      ),
      confirmedAt: null,
    });

    void this.sendConfirmationEmail(email, login, token, locale);
  }

  private async sendConfirmationEmail(
    email: string,
    login: string,
    token: string,
    locale: Locale,
  ): Promise<void> {
    const feUrl = this.userAccountsConfig.feUrl;
    const confirmUrl = `${feUrl}/confirm?token=${token}`;
    await this.resendAdapter.send({
      to: email,
      subject: getConfirmationEmailSubject(locale),
      html: confirmationEmailTemplate(confirmUrl, login, email, locale),
    });
  }
}
