import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GuestsRepository } from '../../infra/guests.repository';
import { GuestResponseRepository } from '../../infra/guest-response.repository';
import { CreateGuestResponseInputDto } from '../../api/input-dto/guest-response.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class CreateGuestResponseCommand {
  constructor(
    public guestId: string,
    public dto: CreateGuestResponseInputDto,
  ) {}
}

@CommandHandler(CreateGuestResponseCommand)
export class CreateGuestResponseUseCase implements ICommandHandler<
  CreateGuestResponseCommand,
  string
> {
  constructor(
    private readonly guestsRepository: GuestsRepository,
    private readonly guestResponseRepository: GuestResponseRepository,
  ) {}

  async execute({ guestId, dto }: CreateGuestResponseCommand): Promise<string> {
    await this.guestsRepository.findGuestByIdOrFail(guestId);

    const isExist = await this.guestResponseRepository.findByGuestId(guestId);
    if (isExist) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Guest has already submitted a response',
      });
    }

    return this.guestResponseRepository.save({
      guest_id: guestId,
      preferred_drinks: dto.preferred_drinks,
      other_preferences: dto.other_preferences,
      plus_one: dto.plus_one,
      plus_one_name: dto.plus_one_name ?? undefined,
    });
  }
}
