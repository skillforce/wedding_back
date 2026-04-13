import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import {
  GenerateRefreshTokenCommand,
  SessionMetadata,
} from './generate-refresh-token.usecase';
import { AuthSessionsRepository } from '../../infra/auth-sessions.repository';
import { UserAccountsConfig } from '../../config/user-accounts.config';
import { UserRole } from '../../domain/entities/user-role.enum';
import { GenerateAccessTokenCommand } from './generate-access-token.usecase';

export class LoginUserCommand {
  constructor(
    public userId: number,
    public role: UserRole,
    public metadata: SessionMetadata,
  ) {}
}

@CommandHandler(LoginUserCommand)
export class LoginUserUseCase implements ICommandHandler<
  LoginUserCommand,
  { accessToken: string; refreshToken: string; deviceId: string }
> {
  constructor(
    private commandBus: CommandBus,
    private readonly authSessionsRepository: AuthSessionsRepository,
    private readonly userAccountsConfig: UserAccountsConfig,
  ) {}

  async execute({ userId, role, metadata }: LoginUserCommand): Promise<{
    accessToken: string;
    refreshToken: string;
    deviceId: string;
  }> {
    await this.revokeExistingDeviceSession(userId, metadata.deviceId);
    await this.enforceSessionLimit(userId);

    const sessionId = randomUUID();

    const accessToken = await this.commandBus.execute<
      GenerateAccessTokenCommand,
      string
    >(new GenerateAccessTokenCommand(userId, sessionId, role));

    const refreshToken = await this.commandBus.execute<
      GenerateRefreshTokenCommand,
      string
    >(new GenerateRefreshTokenCommand(userId, sessionId, metadata));

    return { accessToken, refreshToken, deviceId: metadata.deviceId };
  }

  private async revokeExistingDeviceSession(
    userId: number,
    deviceId: string,
  ): Promise<void> {
    const existing = await this.authSessionsRepository.findByUserAndDevice(
      userId,
      deviceId,
    );
    if (existing) {
      await this.authSessionsRepository.deleteById(existing.id);
    }
  }

  private async enforceSessionLimit(userId: number): Promise<void> {
    const activeCount =
      await this.authSessionsRepository.countActiveByUserId(userId);
    if (activeCount >= this.userAccountsConfig.maxSessionsPerUser) {
      const oldest =
        await this.authSessionsRepository.findOldestActiveByUserId(userId);
      if (oldest) {
        await this.authSessionsRepository.deleteById(oldest.id);
      }
    }
  }
}
