import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { AuthSessionsRepository } from '../../infra/auth-sessions.repository';
import { BcryptService } from '../bcrypt.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { GenerateNewTokenCommand } from './generate-token.usecase';
import {
  GenerateRefreshTokenCommand,
  SessionMetadata,
} from './generate-refresh-token.usecase';

export class RefreshTokenCommand {
  constructor(
    public readonly userId: number,
    public readonly tokenId: string,
    public readonly rawToken: string,
    public readonly metadata: SessionMetadata,
  ) {}
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenUsecase
  implements
    ICommandHandler<
      RefreshTokenCommand,
      { accessToken: string; refreshToken: string }
    >
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly authSessionsRepository: AuthSessionsRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute({
    userId,
    tokenId,
    rawToken,
    metadata,
  }: RefreshTokenCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const session = await this.authSessionsRepository.findById(tokenId);

    if (!session) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        extensions: [
          {
            field: 'refreshToken',
            message: 'Refresh token not found or already used',
          },
        ],
        message: 'Unauthorized',
      });
    }

    const isValid = await this.bcryptService.comparePasswords(
      rawToken,
      session.refreshTokenHash,
    );

    if (!isValid) {
      await this.authSessionsRepository.deleteAllByUserId(userId);
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        extensions: [
          { field: 'refreshToken', message: 'Invalid refresh token' },
        ],
        message: 'Unauthorized',
      });
    }

    await this.authSessionsRepository.deleteById(tokenId);

    const newSessionId = randomUUID();

    const accessToken = await this.commandBus.execute<
      GenerateNewTokenCommand,
      string
    >(new GenerateNewTokenCommand(userId, newSessionId));

    const refreshToken = await this.commandBus.execute<
      GenerateRefreshTokenCommand,
      string
    >(new GenerateRefreshTokenCommand(userId, newSessionId, metadata));

    return { accessToken, refreshToken };
  }
}