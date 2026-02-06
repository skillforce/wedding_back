import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GuestsRepository } from '../../infra/guests.repository';

export class DeleteGuestCommand {
  constructor(
    public guest_id: number,
    public userId: number,
  ) {}
}

@CommandHandler(DeleteGuestCommand)
export class DeleteGuestUseCase implements ICommandHandler<
  DeleteGuestCommand,
  void
> {
  constructor(private guestsRepository: GuestsRepository) {}

  async execute({ guest_id, userId }: DeleteGuestCommand): Promise<void> {
    await this.guestsRepository.findGuestByIdAndUserOwnerIdOrFail(
      guest_id,
      userId,
    );

    return this.guestsRepository.deleteGuestByIdOrFail(guest_id);
  }
}
