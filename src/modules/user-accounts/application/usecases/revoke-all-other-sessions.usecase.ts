import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthSessionsRepository } from '../../infra/auth-sessions.repository';

export class RevokeAllOtherSessionsCommand {
  constructor(
    public readonly userId: number,
    public readonly currentSessionId: string,
  ) {}
}

@CommandHandler(RevokeAllOtherSessionsCommand)
export class RevokeAllOtherSessionsUseCase
  implements ICommandHandler<RevokeAllOtherSessionsCommand, void>
{
  constructor(
    private readonly authSessionsRepository: AuthSessionsRepository,
  ) {}

  async execute({
    userId,
    currentSessionId,
  }: RevokeAllOtherSessionsCommand): Promise<void> {
    await this.authSessionsRepository.deleteAllByUserIdExcept(
      userId,
      currentSessionId,
    );
  }
}