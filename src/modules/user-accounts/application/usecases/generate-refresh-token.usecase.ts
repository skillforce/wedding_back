import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../constants/auth-token.inject-context';
import { UserRefreshContextDto } from '../../guards/dto/user-refresh-context.dto';
import { AuthSessionsRepository } from '../../infra/auth-sessions.repository';
import { BcryptService } from '../bcrypt.service';
import { parseDeviceName } from '../utils/user-agent.util';
export interface SessionMetadata {
  deviceId: string;
  userAgent: string;
}

export class GenerateRefreshTokenCommand {
  constructor(
    public userId: number,
    public sessionId: string,
    public metadata: SessionMetadata,
  ) {}
}

@CommandHandler(GenerateRefreshTokenCommand)
export class GenerateRefreshTokenUsecase
  implements ICommandHandler<GenerateRefreshTokenCommand, string>
{
  constructor(
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenContext: JwtService,
    private readonly authSessionsRepository: AuthSessionsRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute({
    userId,
    sessionId,
    metadata,
  }: GenerateRefreshTokenCommand): Promise<string> {
    const token = this.refreshTokenContext.sign({
      id: userId,
      tokenId: sessionId,
    } as UserRefreshContextDto);

    const tokenHash = await this.bcryptService.hashPassword(token);

    const { exp } = this.refreshTokenContext.decode(token) as { exp: number };
    const expiresAt = new Date(exp * 1000);

    await this.authSessionsRepository.save({
      id: sessionId,
      userId,
      refreshTokenHash: tokenHash,
      expiresAt,
      deviceId: metadata.deviceId,
      userAgent: metadata.userAgent,
      deviceName: parseDeviceName(metadata.userAgent),
      lastActiveAt: new Date(),
    });

    return token;
  }
}