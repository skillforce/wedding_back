import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infra/users.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class DeleteUserCommand {
  constructor(public id: number) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase implements ICommandHandler<
  DeleteUserCommand,
  void
> {
  constructor(public userRepository: UsersRepository) {}

  async execute({ id }: DeleteUserCommand) {
    const result = await this.userRepository.deleteUserById(id);
    if (!result) {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'User does not exist',
      });
    }
  }
}
