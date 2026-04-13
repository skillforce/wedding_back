import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infra/users.repository';
import { EmailConfirmationRepository } from '../../infra/email-confirmation.repository';
import { SendEmailConfirmationCommand } from './send-email-confirmation.usecase';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UserStatus } from '../../domain/entities/user-status.enum';

export class ResendConfirmationCommand {
  constructor(
    public readonly targetUserId: number,
  ) {}
}

@CommandHandler(ResendConfirmationCommand)
export class ResendConfirmationUseCase
  implements ICommandHandler<ResendConfirmationCommand, void>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailConfirmationRepository: EmailConfirmationRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ targetUserId }: ResendConfirmationCommand): Promise<void> {
    const user = await this.usersRepository.findUserById(targetUserId);
    const existing = user
      ? await this.emailConfirmationRepository.findPendingByUserId(targetUserId)
      : null;

    if (!user || user.status === UserStatus.ACTIVE || !existing) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Something went wrong during confirmation',
        extensions: [],
      });
    }

    await this.commandBus.execute(
      new SendEmailConfirmationCommand(targetUserId, existing.email),
    );
  }
}