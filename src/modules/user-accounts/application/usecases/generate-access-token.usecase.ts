import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../constants/auth-token.inject-context';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserContextDto } from '../../guards/dto/user-context.dto';
import { UserRole } from '../../domain/entities/user-role.enum';

export class GenerateAccessTokenCommand {
  constructor(
    public userId: number,
    public sessionId: string,
    public role: UserRole,
  ) {}
}

@CommandHandler(GenerateAccessTokenCommand)
export class GenerateAccessTokenUsecase
  implements ICommandHandler<GenerateAccessTokenCommand, string>
{
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,
  ) {}

  async execute({ userId, sessionId, role }: GenerateAccessTokenCommand): Promise<string> {
    return this.accessTokenContext.sign({
      id: userId,
      sessionId,
      role,
    } as UserContextDto);
  }
}