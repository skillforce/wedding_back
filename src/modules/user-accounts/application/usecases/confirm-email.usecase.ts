import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfirmationRepository } from '../../infra/confirmation.repository';
import { ConfirmationType } from '../../domain/entities/confirmation.entity';
import { UsersRepository } from '../../infra/users.repository';
import { UserStatus } from '../../domain/entities/user-status.enum';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { BcryptService } from '../bcrypt.service';

export class ConfirmEmailCommand {
  constructor(
    public readonly token: string,
    public readonly password: string,
  ) {}
}

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmailUseCase implements ICommandHandler<ConfirmEmailCommand, void> {
  constructor(
    private readonly confirmationRepository: ConfirmationRepository,
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute({ token, password }: ConfirmEmailCommand): Promise<void> {
    const confirmation = await this.confirmationRepository.findByToken(token, ConfirmationType.EMAIL_CONFIRMATION);

    if (!confirmation) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Something went wrong during confirmation',
        extensions: [],
      });
    }

    const passwordHash = await this.bcryptService.hashPassword(password);

    const claimed = await this.confirmationRepository.markConfirmed(token);

    if (!claimed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Something went wrong during confirmation',
        extensions: [],
      });
    }

    await this.usersRepository.save({
      id: confirmation.userId,
      status: UserStatus.ACTIVE,
      passwordHash,
    });
  }
}