import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserProfilesRepository } from '../../infra/user-profiles.repository';

export class CreateDefaultProfileCommand {
  constructor(
    public readonly userId: number,
    public readonly email?: string,
  ) {}
}

@CommandHandler(CreateDefaultProfileCommand)
export class CreateDefaultProfileUseCase
  implements ICommandHandler<CreateDefaultProfileCommand, void>
{
  constructor(
    private readonly userProfilesRepository: UserProfilesRepository,
  ) {}

  async execute({ userId, email }: CreateDefaultProfileCommand): Promise<void> {
    await this.userProfilesRepository.save({ userId, email: email ?? null } as any);
  }
}