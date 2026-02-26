import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GuestsRepository } from '../../infra/guests.repository';
import { GuestResponseRepository } from '../../infra/guest-response.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class DeleteGuestResponseCommand {
  constructor(
    public guestId: string,
    public userId: number,
  ) {}
}

@CommandHandler(DeleteGuestResponseCommand)
export class DeleteGuestResponseUseCase
  implements ICommandHandler<DeleteGuestResponseCommand, void>
{
  constructor(
    private readonly guestsRepository: GuestsRepository,
    private readonly guestResponseRepository: GuestResponseRepository,
  ) {}

  async execute({ guestId, userId }: DeleteGuestResponseCommand): Promise<void> {
    const guest = await this.guestsRepository.findGuestByIdOrFail(guestId);

    if (guest.user_id !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Access denied',
      });
    }

    const response = await this.guestResponseRepository.findByGuestId(guestId);
    if (!response) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Guest response not found',
      });
    }

    await this.guestResponseRepository.deleteByGuestId(guestId);
  }
}