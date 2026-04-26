import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GuestFormRepository } from '../../infra/guest-form.repository';
import { UpdateGuestFormInputDto } from '../../api/input-dto/update-guest-form.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { SyncCoupleLinkCommand } from './sync-couple-link.usecase';
import { CACHE_INVALIDATOR, CachePrefix } from '../../../../adapters/redis/constants';
import { ICacheInvalidator } from '../../../../adapters/redis/cache-invalidator';
import { CacheKey } from '../../../../adapters/redis/cache-key';

export class UpdateGuestFormCommand {
  constructor(
    public guestId: string,
    public dto: UpdateGuestFormInputDto,
    public userId: number,
  ) {}
}

@CommandHandler(UpdateGuestFormCommand)
export class UpdateGuestFormUseCase implements ICommandHandler<
  UpdateGuestFormCommand,
  string[]
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly commandBus: CommandBus,
    private readonly guestFormRepository: GuestFormRepository,
    @Inject(CACHE_INVALIDATOR) private readonly cacheInvalidator: ICacheInvalidator,
  ) {}

  async execute({
    guestId,
    dto,
    userId,
  }: UpdateGuestFormCommand): Promise<string[]> {
    const affectedPartnerIds: string[] = [];

    await this.dataSource.transaction(async (manager) => {
      const form = await this.guestFormRepository.findByGuestIdForUpdateOrFail(
        manager,
        guestId,
      );

      this.checkOwnership(form.guest?.user_id, userId);

      const previousCoupleId = form.if_with_couple_couple_id;

      if (dto.relationship_to_couple !== undefined) {
        form.relationship_to_couple = dto.relationship_to_couple;
      }
      if (dto.age_group !== undefined) {
        form.age_group = dto.age_group;
      }
      if (dto.has_kids_attending !== undefined) {
        form.has_kids_attending = dto.has_kids_attending;
      }
      if (dto.amount_of_kids !== undefined) {
        form.amount_of_kids = dto.amount_of_kids;
      }
      if (dto.personality_type !== undefined) {
        form.personality_type = dto.personality_type;
      }
      if (dto.vip_parents !== undefined) {
        form.vip_parents = dto.vip_parents;
      }
      if (dto.vip_grandparents !== undefined) {
        form.vip_grandparents = dto.vip_grandparents;
      }
      if (dto.vip_relatives !== undefined) {
        form.vip_relatives = dto.vip_relatives;
      }
      if (dto.ifWithCouple !== undefined) {
        form.if_with_couple_response = dto.ifWithCouple.response;
        form.if_with_couple_couple_id = dto.ifWithCouple.coupleId ?? null;
      }

      await this.guestFormRepository.saveEntityWithManager(manager, form);

      if (dto.ifWithCouple !== undefined) {
        const syncAffectedIds = await this.syncCoupleLink(
          guestId,
          dto.ifWithCouple.coupleId ?? null,
          previousCoupleId,
        );
        affectedPartnerIds.push(...syncAffectedIds);
      }
    });

    await this.cacheInvalidator.invalidate(CacheKey.userPrefix(CachePrefix.Guests, userId));
    return [guestId, ...affectedPartnerIds];
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

  private checkOwnership(
    ownerUserId: number | undefined,
    userId: number,
  ): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Guest does not belong to user',
      });
    }
  }
}
