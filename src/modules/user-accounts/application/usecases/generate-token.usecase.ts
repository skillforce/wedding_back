import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../constants/auth-token.inject-context';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../../guards/dto/user-context.dto';

export class GenerateNewTokenCommand {
  constructor(
    public userId: number,
    public sessionId: string,
  ) {}
}

@CommandHandler(GenerateNewTokenCommand)
export class GenerateNewTokenUsecase
  implements ICommandHandler<GenerateNewTokenCommand, string>
{
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,
  ) {}

  async execute({ userId, sessionId }: GenerateNewTokenCommand): Promise<string> {
    return this.accessTokenContext.sign({
      id: userId,
      sessionId,
    } as UserContextDto);
  }
}