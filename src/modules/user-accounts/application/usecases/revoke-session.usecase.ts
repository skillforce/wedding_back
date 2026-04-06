import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthSessionsRepository } from '../../infra/auth-sessions.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class RevokeSessionCommand {
  constructor(
    public readonly sessionId: string,
    public readonly userId: number,
  ) {}
}

@CommandHandler(RevokeSessionCommand)
export class RevokeSessionUseCase
  implements ICommandHandler<RevokeSessionCommand, void>
{
  constructor(
    private readonly authSessionsRepository: AuthSessionsRepository,
  ) {}

  async execute({ sessionId, userId }: RevokeSessionCommand): Promise<void> {
    const session = await this.authSessionsRepository.findById(sessionId);

    if (!session || session.userId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        extensions: [{ field: 'sessionId', message: 'Session not found' }],
        message: 'Session not found',
      });
    }

    await this.authSessionsRepository.deleteById(sessionId);
  }
}