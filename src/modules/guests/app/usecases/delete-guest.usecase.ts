import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GuestsRepository } from '../../infra/guests.repository';
import { CACHE_INVALIDATOR, CachePrefix } from '../../../../adapters/redis/constants';
import { ICacheInvalidator } from '../../../../adapters/redis/cache-invalidator';
import { CacheKey } from '../../../../adapters/redis/cache-key';

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
    @Inject(CACHE_INVALIDATOR) private readonly cacheInvalidator: ICacheInvalidator,
  ) {}

  async execute({ guest_id, userId }: DeleteGuestCommand): Promise<void> {
    await this.guestsRepository.findGuestByIdAndUserOwnerIdOrFail(
      guest_id,
      userId,
    );

    await this.guestsRepository.deleteGuestByIdOrFail(guest_id);
    await this.cacheInvalidator.invalidate(CacheKey.userPrefix(CachePrefix.Guests, userId));
  }
}
