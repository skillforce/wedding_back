import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../constants/auth-token.inject-context';
import { UserRefreshContextDto } from '../../guards/dto/user-refresh-context.dto';
import { RefreshTokensRepository } from '../../infra/refresh-tokens.repository';
import { BcryptService } from '../bcrypt.service';

export class GenerateRefreshTokenCommand {
  constructor(public userId: number) {}
}

@CommandHandler(GenerateRefreshTokenCommand)
export class GenerateRefreshTokenUsecase
  implements ICommandHandler<GenerateRefreshTokenCommand, string>
{
  constructor(
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenContext: JwtService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute({ userId }: GenerateRefreshTokenCommand): Promise<string> {
    const tokenId = randomUUID();

    const token = this.refreshTokenContext.sign({
      id: userId,
      tokenId,
    } as UserRefreshContextDto);

    const tokenHash = await this.bcryptService.hashPassword(token);

    const { exp } = this.refreshTokenContext.decode(token) as { exp: number };
    const expiresAt = new Date(exp * 1000);

    await this.refreshTokensRepository.save({
      id: tokenId,
      userId,
      tokenHash,
      expiresAt,
    });

    return token;
  }
}