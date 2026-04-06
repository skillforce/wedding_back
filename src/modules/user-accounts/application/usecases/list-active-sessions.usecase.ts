import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuthSessionsQueryRepository } from '../../infra/query/auth-sessions.query-repository';
import { SessionViewDto } from '../../api/view-dto/session.view-dto';

export class ListActiveSessionsCommand {
  constructor(
    public readonly userId: number,
    public readonly currentSessionId: string,
  ) {}
}

@CommandHandler(ListActiveSessionsCommand)
export class ListActiveSessionsUseCase
  implements ICommandHandler<ListActiveSessionsCommand, SessionViewDto[]>
{
  constructor(
    private readonly authSessionsQueryRepository: AuthSessionsQueryRepository,
  ) {}

  async execute({
    userId,
    currentSessionId,
  }: ListActiveSessionsCommand): Promise<SessionViewDto[]> {
    const sessions =
      await this.authSessionsQueryRepository.findActiveByUserId(userId);
    return sessions.map((s) => SessionViewDto.mapToView(s, currentSessionId));
  }
}