import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GuestsRepository } from '../../infra/guests.repository';

export class DeleteGuestCommand {
  constructor(public guest_id: number) {}
}

@CommandHandler(DeleteGuestCommand)
export class DeleteGuestUseCase implements ICommandHandler<
  DeleteGuestCommand,
  void
> {
  constructor(private guestsRepository: GuestsRepository) {}

  async execute({ guest_id }: DeleteGuestCommand): Promise<void> {
    await this.guestsRepository.findGuestByIdOrFail(guest_id);

    return this.guestsRepository.deleteGuestByIdOrFail(guest_id);
  }
}
