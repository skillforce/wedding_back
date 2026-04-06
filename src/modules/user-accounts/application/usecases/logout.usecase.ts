import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthSessionsRepository } from '../../infra/auth-sessions.repository';

export class LogoutCommand {
  constructor(public readonly tokenId: string) {}
}

@CommandHandler(LogoutCommand)
export class LogoutUsecase implements ICommandHandler<LogoutCommand, void> {
  constructor(
    private readonly authSessionsRepository: AuthSessionsRepository,
  ) {}

  async execute({ tokenId }: LogoutCommand): Promise<void> {
    await this.authSessionsRepository.deleteById(tokenId);
  }
}