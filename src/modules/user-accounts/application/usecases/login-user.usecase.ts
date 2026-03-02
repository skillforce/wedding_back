import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GenerateNewTokenCommand } from './generate-token.usecase';
import { GenerateRefreshTokenCommand } from './generate-refresh-token.usecase';

export class LoginUserCommand {
  constructor(public userId: number) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<
  LoginUserCommand,
  { accessToken: string; refreshToken: string }
> {
  constructor(private commandBus: CommandBus) {}

  async execute({
    userId,
  }: LoginUserCommand): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.commandBus.execute<
      GenerateNewTokenCommand,
      string
    >(new GenerateNewTokenCommand(userId));

    const refreshToken = await this.commandBus.execute<
      GenerateRefreshTokenCommand,
      string
    >(new GenerateRefreshTokenCommand(userId));

    return { accessToken, refreshToken };
  }
}
