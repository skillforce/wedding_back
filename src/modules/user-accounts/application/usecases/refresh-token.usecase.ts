import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RefreshTokensRepository } from '../../infra/refresh-tokens.repository';
import { BcryptService } from '../bcrypt.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { GenerateNewTokenCommand } from './generate-token.usecase';
import { GenerateRefreshTokenCommand } from './generate-refresh-token.usecase';

export class RefreshTokenCommand {
  constructor(
    public readonly userId: number,
    public readonly tokenId: string,
    public readonly rawToken: string,
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
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute({
    userId,
    tokenId,
    rawToken,
  }: RefreshTokenCommand): Promise<{ accessToken: string; refreshToken: string }> {
    const record = await this.refreshTokensRepository.findById(tokenId);

    if (!record) {
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
      record.tokenHash,
    );

    if (!isValid) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        extensions: [{ field: 'refreshToken', message: 'Invalid refresh token' }],
        message: 'Unauthorized',
      });
    }

    await this.refreshTokensRepository.deleteById(tokenId);

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