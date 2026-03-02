import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RefreshTokensRepository } from '../../infra/refresh-tokens.repository';

export class LogoutCommand {
  constructor(public readonly tokenId: string) {}
}

@CommandHandler(LogoutCommand)
export class LogoutUsecase implements ICommandHandler<LogoutCommand, void> {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  async execute({ tokenId }: LogoutCommand): Promise<void> {
    await this.refreshTokensRepository.deleteById(tokenId);
  }
}