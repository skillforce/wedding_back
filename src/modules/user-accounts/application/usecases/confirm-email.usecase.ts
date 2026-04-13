import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailConfirmationRepository } from '../../infra/email-confirmation.repository';
import { UsersRepository } from '../../infra/users.repository';
import { UserStatus } from '../../domain/entities/user-status.enum';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class ConfirmEmailCommand {
  constructor(public readonly token: string) {}
}

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmailUseCase implements ICommandHandler<ConfirmEmailCommand, void> {
  constructor(
    private readonly emailConfirmationRepository: EmailConfirmationRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute({ token }: ConfirmEmailCommand): Promise<void> {
    const confirmation = await this.emailConfirmationRepository.findByToken(token);

    if (!confirmation || confirmation.confirmedAt || confirmation.expiresAt < new Date()) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Something went wrong during confirmation',
        extensions: [],
      });
    }

    await this.emailConfirmationRepository.markConfirmed(token);
    await this.usersRepository.save({ id: confirmation.userId, status: UserStatus.ACTIVE });
  }
}