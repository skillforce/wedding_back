import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';
import { GuestFormRepository } from '../../infra/guest-form.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class SyncCoupleLinkCommand {
  constructor(
    public readonly guestId: string,
    public readonly newCoupleId: string | null,
    public readonly previousCoupleId: string | null,
  ) {}
}

@CommandHandler(SyncCoupleLinkCommand)
export class SyncCoupleLinkUseCase implements ICommandHandler<
  SyncCoupleLinkCommand,
  string[]
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly guestFormRepository: GuestFormRepository,
  ) {}

  async execute({
    guestId,
    newCoupleId,
    previousCoupleId,
  }: SyncCoupleLinkCommand): Promise<string[]> {
    return this.dataSource.transaction(async (manager) => {
      const affectedIds: string[] = [];

      const unlinkedId = await this.unlinkPreviousPartner(
        manager,
        guestId,
        newCoupleId,
        previousCoupleId,
      );
      if (unlinkedId) affectedIds.push(unlinkedId);

      const linkedId = await this.linkNewPartner(manager, guestId, newCoupleId);
      if (linkedId) affectedIds.push(linkedId);

      return affectedIds;
    });
  }

  private async unlinkPreviousPartner(
    manager: EntityManager,
    guestId: string,
    newCoupleId: string | null,
    previousCoupleId: string | null,
  ): Promise<string | null> {
    if (!previousCoupleId || previousCoupleId === newCoupleId) return null;

    const oldPartnerForm =
      await this.guestFormRepository.findByGuestIdNullableWithManager(
        manager,
        previousCoupleId,
      );
    if (oldPartnerForm?.if_with_couple_couple_id === guestId) {
      oldPartnerForm.if_with_couple_response = false;
      oldPartnerForm.if_with_couple_couple_id = null;
      await this.guestFormRepository.saveEntityWithManager(
        manager,
        oldPartnerForm,
      );
      return previousCoupleId;
    }

    return null;
  }

  private async linkNewPartner(
    manager: EntityManager,
    guestId: string,
    newCoupleId: string | null,
  ): Promise<string | null> {
    if (!newCoupleId) return null;

    const newPartnerForm =
      await this.guestFormRepository.findByGuestIdNullableWithManager(
        manager,
        newCoupleId,
      );
    if (!newPartnerForm) return null;

    if (
      newPartnerForm.if_with_couple_couple_id !== null &&
      newPartnerForm.if_with_couple_couple_id !== guestId
    ) {
      throw new DomainException({
        code: DomainExceptionCode.Conflict,
        message: 'Target guest already has a couple assigned',
      });
    }

    newPartnerForm.if_with_couple_response = true;
    newPartnerForm.if_with_couple_couple_id = guestId;
    await this.guestFormRepository.saveEntityWithManager(
      manager,
      newPartnerForm,
    );
    return newCoupleId;
  }
}
