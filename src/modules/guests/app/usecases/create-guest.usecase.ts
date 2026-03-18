import { CreateGuestInputDto } from '../../api/input-dto/guest.input-dto';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GuestsRepository } from '../../infra/guests.repository';
import { GuestFormRepository } from '../../infra/guest-form.repository';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { SyncCoupleLinkCommand } from './sync-couple-link.usecase';

export class CreateGuestCommand {
  constructor(public dto: CreateGuestInputDto) {}
}

@CommandHandler(CreateGuestCommand)
export class CreateGuestUseCase implements ICommandHandler<
  CreateGuestCommand,
  string
> {
  constructor(
    private readonly commandBus: CommandBus,
    private guestsRepository: GuestsRepository,
    private guestFormRepository: GuestFormRepository,
  ) {}

  async execute({ dto }: CreateGuestCommand): Promise<string> {
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

    if (dto.guestForm) {
      await this.guestFormRepository.save(guestId, dto.guestForm);

      const coupleId = dto.guestForm.ifWithCouple?.coupleId ?? null;
      if (coupleId) {
        await this.syncCoupleLink(guestId, coupleId, null);
      }
    }

    return guestId;
  }

  private async syncCoupleLink(
    guestId: string,
    newCoupleId: string | null,
    previousCoupleId: string | null,
  ): Promise<void> {
    await this.commandBus.execute(
      new SyncCoupleLinkCommand(guestId, newCoupleId, previousCoupleId),
    );
  }
}
