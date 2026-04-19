import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infra/users.repository';
import { BcryptService } from '../bcrypt.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UserRole } from '../../domain/entities/user-role.enum';
import { UserStatus } from '../../domain/entities/user-status.enum';
import { CreatePlainUserInputDto } from '../../api/input-dto/create-plain-user.input-dto';
import { SendEmailConfirmationCommand } from './send-email-confirmation.usecase';
import { EmailConfirmationRepository } from '../../infra/email-confirmation.repository';
import { CreateDefaultSeatingArrangementCommand } from '../../../seating-arrangements/app/usecases/create-default-seating-arrangement.usecase';
import { CreateDefaultBudgetCommand } from '../../../budget/app/usecases/create-default-budget.usecase';
import { CreateDefaultChecklistCommand } from '../../../checklist/app/usecases/create-default-checklist.usecase';
import { CreateDefaultProfileCommand } from './create-default-profile.usecase';
import { CreateDefaultScenarioCommand } from '../../../scenario/app/usecases/create-default-scenario.usecase';

export class CreatePlainUserCommand {
  constructor(
    public readonly dto: CreatePlainUserInputDto,
    public readonly creatorUserId: number,
  ) {}
}

@CommandHandler(CreatePlainUserCommand)
export class CreatePlainUserUseCase
  implements ICommandHandler<CreatePlainUserCommand, number>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailConfirmationRepository: EmailConfirmationRepository,
    private readonly bcryptService: BcryptService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute({ dto, creatorUserId }: CreatePlainUserCommand): Promise<number> {
    await this.checkUniqueFields(dto.login, dto.email);

    const passwordHash = await this.bcryptService.hashPassword(dto.password);

    const userId = await this.usersRepository.save({
      login: dto.login,
      passwordHash,
      role: UserRole.PLAIN_USER,
      status: UserStatus.PENDING_CONFIRMATION,
      createdByUserId: creatorUserId,
    });

    await this.commandBus.execute(new CreateDefaultSeatingArrangementCommand(userId));
    await this.commandBus.execute(new CreateDefaultBudgetCommand(userId));
    await this.commandBus.execute(new CreateDefaultChecklistCommand(userId));
    await this.commandBus.execute(new CreateDefaultScenarioCommand(userId));
    await this.commandBus.execute(new CreateDefaultProfileCommand(userId, dto.email));

    await this.commandBus.execute(new SendEmailConfirmationCommand(userId, dto.email, dto.locale));

    return userId;
  }

  private async checkUniqueFields(login: string, email: string): Promise<void> {
    const [existingLogin, existingEmail] = await Promise.all([
      this.usersRepository.findUserByLogin(login),
      this.emailConfirmationRepository.existsByEmail(email),
    ]);

    if (existingLogin || existingEmail) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [{ field: 'login or email', message: 'login or email is already in use' }],
        message: 'login or email is already in use',
      });
    }
  }
}