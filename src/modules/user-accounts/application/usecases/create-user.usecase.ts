import { UserDto } from '../../dto/user.dto';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infra/users.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { BcryptService } from '../bcrypt.service';
import { CreateUserDomainDto } from '../../domain/dto/create-user.domain.dto';
import { User } from '../../domain/entities/user.entity';
import { CreateDefaultSeatingTableCommand } from '../../../seating-arrangements/app/usecases/create-default-seating-table.usecase';
import { CreateDefaultBudgetCommand } from '../../../budget/app/usecases/create-default-budget.usecase';
import { CreateDefaultChecklistCommand } from '../../../checklist/app/usecases/create-default-checklist.usecase';

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
  ) {}

  async execute({ dto }: CreateUserCommand) {
    await this.checkUserDtoForUniqueFields(dto.login);
    const passwordHash = await this.bcryptService.hashPassword(dto.password);

    const newUser = this.createUser({ login: dto.login, passwordHash });

    const userId = await this.userRepository.save(newUser);
    await this.commandBus.execute(new CreateDefaultSeatingTableCommand(userId));
    await this.commandBus.execute(new CreateDefaultBudgetCommand(userId));
    await this.commandBus.execute(new CreateDefaultChecklistCommand(userId));
    return userId;
  }

  private async checkUserDtoForUniqueFields(login: string) {
    const usersWithSameLogin = await this.userRepository.findUserByLogin(login);

    if (usersWithSameLogin) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [
          {
            field: 'login',
            message: 'user with this login already exists',
          },
        ],
        message: 'user with this login already exists',
      });
    }
  }

  private createUser(dto: CreateUserDomainDto): Omit<User, 'id'> {
    return {
      login: dto.login,
      passwordHash: dto.passwordHash,
    };
  }
}
