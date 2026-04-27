import { CacheService } from '../../../../adapters/redis/cache.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GuestsRepository } from '../../infra/guests.repository';

export class DeleteGuestCommand {
  constructor(
    public guest_id: string,
    public userId: number,
  ) {}
}

@CommandHandler(DeleteGuestCommand)
export class DeleteGuestUseCase implements ICommandHandler<
  DeleteGuestCommand,
  void
> {
  constructor(
    private guestsRepository: GuestsRepository,
    private readonly cache: CacheService,
  ) {}

  async execute({ guest_id, userId }: DeleteGuestCommand): Promise<void> {
    await this.guestsRepository.findGuestByIdAndUserOwnerIdOrFail(
      guest_id,
      userId,
    );

    await this.guestsRepository.deleteGuestByIdOrFail(guest_id);
    await this.cache.evictGuests(userId);
  }
}
