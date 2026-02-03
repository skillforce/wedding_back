import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GenerateNewTokenCommand } from './generate-token.usecase';

export class LoginUserCommand {
  constructor(public userId: number) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<
  LoginUserCommand,
  { accessToken: string }
> {
  constructor(private commandBus: CommandBus) {}

  async execute({
    userId,
  }: LoginUserCommand): Promise<{ accessToken: string }> {
    const accessToken = await this.commandBus.execute<
      GenerateNewTokenCommand,
      string
    >(new GenerateNewTokenCommand(userId));
    return { accessToken };
  }
}
