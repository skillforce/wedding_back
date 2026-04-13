import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infra/users.repository';
import { UserRole } from '../../domain/entities/user-role.enum';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class ValidateUserOwnershipCommand {
  constructor(
    public readonly requestingUserId: number,
    public readonly requestingUserRole: UserRole,
    public readonly targetUserId?: number,
  ) {}
}

@CommandHandler(ValidateUserOwnershipCommand)
export class ValidateUserOwnershipUseCase implements ICommandHandler<
  ValidateUserOwnershipCommand,
  number
> {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({
    requestingUserId,
    requestingUserRole,
    targetUserId,
  }: ValidateUserOwnershipCommand): Promise<number> {
    if (targetUserId === undefined) return requestingUserId;
    if (requestingUserId === targetUserId) return requestingUserId;

    this.isHasSuperUserRole(requestingUserRole);
    await this.isCreatedByRequestingUser(targetUserId, requestingUserId);

    return targetUserId;
  }

  private isHasSuperUserRole(role: UserRole): void {
    if (role !== UserRole.SUPER_USER) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Access denied',
      });
    }
  }

  private async isCreatedByRequestingUser(
    targetUserId: number,
    requestingUserId: number,
  ): Promise<void> {
    const targetUser = await this.usersRepository.findUserById(targetUserId);
    if (!targetUser || targetUser.createdByUserId !== requestingUserId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Access denied',
      });
    }
  }
}
