import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GuestFormRepository } from '../../infra/guest-form.repository';

export class SyncCoupleLinkCommand {
  constructor(
    public readonly guestId: string,
    public readonly newCoupleId: string | null,
    public readonly previousCoupleId: string | null,
  ) {}
}

@CommandHandler(SyncCoupleLinkCommand)
export class SyncCoupleLinkUseCase
  implements ICommandHandler<SyncCoupleLinkCommand, void>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly guestFormRepository: GuestFormRepository,
  ) {}

  async execute({
    guestId,
    newCoupleId,
    previousCoupleId,
  }: SyncCoupleLinkCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      if (previousCoupleId && previousCoupleId !== newCoupleId) {
        const oldPartnerForm =
          await this.guestFormRepository.findByGuestIdNullableWithManager(
            manager,
            previousCoupleId,
          );
        if (oldPartnerForm?.if_with_couple_couple_id === guestId) {
          oldPartnerForm.if_with_couple_couple_id = null;
          await this.guestFormRepository.saveEntityWithManager(
            manager,
            oldPartnerForm,
          );
        }
      }

      if (newCoupleId) {
        const newPartnerForm =
          await this.guestFormRepository.findByGuestIdNullableWithManager(
            manager,
            newCoupleId,
          );
        if (newPartnerForm) {
          newPartnerForm.if_with_couple_response = true;
          newPartnerForm.if_with_couple_couple_id = guestId;
          await this.guestFormRepository.saveEntityWithManager(
            manager,
            newPartnerForm,
          );
        }
      }
    });
  }
}