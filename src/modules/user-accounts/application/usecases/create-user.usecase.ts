import { UserDto } from '../../dto/user.dto';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infra/users.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { BcryptService } from '../bcrypt.service';
import { CreateUserDomainDto } from '../../domain/dto/create-user.domain.dto';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { CreateDefaultSeatingArrangementCommand } from '../../../seating-arrangements/app/usecases/create-default-seating-arrangement.usecase';
import { CreateDefaultBudgetCommand } from '../../../budget/app/usecases/create-default-budget.usecase';
import { CreateChecklistCommand } from '../../../checklist/app/usecases/create-checklist.usecase';
import { CreateDefaultProfileCommand } from './create-default-profile.usecase';
import { CreateDefaultScenarioCommand } from '../../../scenario/app/usecases/create-default-scenario.usecase';
import { ConfirmationRepository } from '../../infra/confirmation.repository';

export class CreateUserCommand {
  constructor(public dto: UserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<
  CreateUserCommand,
  number
> {
  constructor(
    public userRepository: UsersRepository,
    public bcryptService: BcryptService,
    private readonly commandBus: CommandBus,
    private readonly confirmationRepository: ConfirmationRepository,
  ) {}

  async execute({ dto }: CreateUserCommand) {
    await this.checkUniqueFields(dto.login, dto.email);
    const passwordHash = await this.bcryptService.hashPassword(dto.password);

    const newUser = this.createUser({
      login: dto.login,
      passwordHash,
      role: dto.role ?? UserRole.PLAIN_USER,
      createdByUserId: null,
    });

    const userId = await this.userRepository.save(newUser);
    await this.commandBus.execute(
      new CreateDefaultSeatingArrangementCommand(userId),
    );
    await this.commandBus.execute(new CreateDefaultBudgetCommand(userId));
    await this.commandBus.execute(new CreateChecklistCommand(userId));
    await this.commandBus.execute(new CreateDefaultScenarioCommand(userId));
    await this.commandBus.execute(new CreateDefaultProfileCommand(userId, dto.email));
    return userId;
  }

  private async checkUniqueFields(login: string, email: string): Promise<void> {
    const [existingLogin, existingEmail] = await Promise.all([
      this.userRepository.findUserByLogin(login),
      this.confirmationRepository.existsByEmail(email),
    ]);

    if (existingLogin || existingEmail) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [
          { field: 'login or email', message: 'login or email is already in use' },
        ],
        message: 'login or email is already in use',
      });
    }
  }

  private createUser(dto: CreateUserDomainDto): Partial<User> {
    return {
      login: dto.login,
      passwordHash: dto.passwordHash,
      role: dto.role,
      createdByUserId: dto.createdByUserId,
    };
  }
}
