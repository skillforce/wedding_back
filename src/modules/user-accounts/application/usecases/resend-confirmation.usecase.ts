import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infra/users.repository';
import { ConfirmationRepository } from '../../infra/confirmation.repository';
import { ConfirmationType } from '../../domain/entities/confirmation.entity';
import { SendEmailConfirmationCommand } from './send-email-confirmation.usecase';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UserStatus } from '../../domain/entities/user-status.enum';
import { Locale } from '../../../email/templates/confirmation-email.template';

export class ResendConfirmationCommand {
  constructor(
    public readonly targetUserId: number,
    public readonly locale: Locale = 'en',
  ) {}
}

@CommandHandler(ResendConfirmationCommand)
export class ResendConfirmationUseCase
  implements ICommandHandler<ResendConfirmationCommand, void>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly confirmationRepository: ConfirmationRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ targetUserId, locale }: ResendConfirmationCommand): Promise<void> {
    const user = await this.usersRepository.findUserById(targetUserId);
    const existing = user
      ? await this.confirmationRepository.findPendingByUserId(targetUserId, ConfirmationType.EMAIL_CONFIRMATION)
      : null;

    if (!user || user.status === UserStatus.ACTIVE || !existing) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Something went wrong during confirmation',
        extensions: [],
      });
    }

    await this.commandBus.execute(
      new SendEmailConfirmationCommand(targetUserId, existing.email, user.login, locale),
    );
  }
}