import { UserDto } from '../../dto/user.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infra/users.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { BcryptService } from '../bcrypt.service';
import { CreateUserDomainDto } from '../../domain/dto/create-user.domain.dto';
import { User } from '../../domain/entities/user.entity';

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
  ) {}

  async execute({ dto }: CreateUserCommand) {
    await this.checkUserDtoForUniqueFields(dto.login);
    const passwordHash = await this.bcryptService.hashPassword(dto.password);

    const newUser = this.createUser({ login: dto.login, passwordHash });

    return await this.userRepository.save(newUser);
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
