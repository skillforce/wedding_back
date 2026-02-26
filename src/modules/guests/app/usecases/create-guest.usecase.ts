import { CreateGuestInputDto } from '../../api/input-dto/guest.input-dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GuestsRepository } from '../../infra/guests.repository';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';

export class CreateGuestCommand {
  constructor(public dto: CreateGuestInputDto) {}
}

@CommandHandler(CreateGuestCommand)
export class CreateGuestUseCase implements ICommandHandler<
  CreateGuestCommand,
  string
> {
  constructor(private guestsRepository: GuestsRepository) {}

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

    const guestToCreate = { ...dto, user_id: dto.user_id };
    return await this.guestsRepository.save(guestToCreate);
  }
}
