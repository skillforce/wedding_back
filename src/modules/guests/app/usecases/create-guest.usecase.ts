import { CreateGuestInputDto } from '../../api/input-dto/guest.input-dto';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GuestsRepository } from '../../infra/guests.repository';
import { GuestFormRepository } from '../../infra/guest-form.repository';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { SyncCoupleLinkCommand } from './sync-couple-link.usecase';
import { CACHE_INVALIDATOR, CachePrefix } from '../../../../adapters/redis/constants';
import { ICacheInvalidator } from '../../../../adapters/redis/cache-invalidator';
import { CacheKey } from '../../../../adapters/redis/cache-key';

export class CreateGuestCommand {
  constructor(public dto: CreateGuestInputDto) {}
}

@CommandHandler(CreateGuestCommand)
export class CreateGuestUseCase implements ICommandHandler<
  CreateGuestCommand,
  string[]
> {
  constructor(
    private readonly commandBus: CommandBus,
    private guestsRepository: GuestsRepository,
    private guestFormRepository: GuestFormRepository,
    @Inject(CACHE_INVALIDATOR) private readonly cacheInvalidator: ICacheInvalidator,
  ) {}

  async execute({ dto }: CreateGuestCommand): Promise<string[]> {
    const userWithSameName = await this.guestsRepository.findGuestByName(
      dto.guest_name,
      dto.user_id,
    );
    if (userWithSameName) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Guest with same name already exists',
      });
    }

    const guestId = await this.guestsRepository.save({
      guest_name: dto.guest_name,
      user_id: dto.user_id,
    });

    const affectedIds: string[] = [guestId];

    if (dto.guestForm) {
      await this.guestFormRepository.save(guestId, dto.guestForm);

      const coupleId = dto.guestForm.ifWithCouple?.coupleId ?? null;
      if (coupleId) {
        const syncAffectedIds = await this.syncCoupleLink(
          guestId,
          coupleId,
          null,
        );
        affectedIds.push(...syncAffectedIds);
      }
    }

    await this.cacheInvalidator.invalidate(CacheKey.userPrefix(CachePrefix.Guests, dto.user_id));
    return affectedIds;
  }

  private async syncCoupleLink(
    guestId: string,
    newCoupleId: string | null,
    previousCoupleId: string | null,
  ): Promise<string[]> {
    return this.commandBus.execute(
      new SyncCoupleLinkCommand(guestId, newCoupleId, previousCoupleId),
    );
  }
}
