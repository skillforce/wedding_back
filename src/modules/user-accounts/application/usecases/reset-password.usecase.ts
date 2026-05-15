import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfirmationRepository } from '../../infra/confirmation.repository';
import { ConfirmationType } from '../../domain/entities/confirmation.entity';
import { UsersRepository } from '../../infra/users.repository';
import { AuthSessionsRepository } from '../../infra/auth-sessions.repository';
import { BcryptService } from '../bcrypt.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class ResetPasswordCommand {
  constructor(
    public readonly token: string,
    public readonly password: string,
    public readonly userId: number,
  ) {}
}

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordUseCase implements ICommandHandler<ResetPasswordCommand, void> {
  constructor(
    private readonly confirmationRepository: ConfirmationRepository,
    private readonly usersRepository: UsersRepository,
    private readonly authSessionsRepository: AuthSessionsRepository,
    private readonly bcryptService: BcryptService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async execute({ token, password, userId }: ResetPasswordCommand): Promise<void> {
    const confirmation = await this.confirmationRepository.findByToken(
      token,
      ConfirmationType.PASSWORD_RESET,
    );

    if (!confirmation || confirmation.userId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid or expired password reset token',
        extensions: [],
      });
    }

    const passwordHash = await this.bcryptService.hashPassword(password);

    await this.dataSource.transaction(async (manager) => {
      const claimed = await this.confirmationRepository.markConfirmedWithManager(token, manager);

      if (!claimed) {
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message: 'Invalid or expired password reset token',
          extensions: [],
        });
      }

      await this.usersRepository.saveWithManager({ id: confirmation.userId, passwordHash }, manager);
      await this.authSessionsRepository.deleteAllByUserIdWithManager(confirmation.userId, manager);
    });
  }
}