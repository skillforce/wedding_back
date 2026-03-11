import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { GuestFormRepository } from '../../infra/guest-form.repository';
import { UpdateGuestFormInputDto } from '../../api/input-dto/update-guest-form.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class UpdateGuestFormCommand {
  constructor(
    public guestId: string,
    public dto: UpdateGuestFormInputDto,
    public userId: number,
  ) {}
}

@CommandHandler(UpdateGuestFormCommand)
export class UpdateGuestFormUseCase implements ICommandHandler<UpdateGuestFormCommand, void> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly guestFormRepository: GuestFormRepository,
  ) {}

  async execute({ guestId, dto, userId }: UpdateGuestFormCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const form = await this.guestFormRepository.findByGuestIdForUpdateOrFail(
        manager,
        guestId,
      );

      this.checkOwnership(form.guest?.user_id, userId);

      if (dto.relationship_to_couple !== undefined) {
        form.relationship_to_couple = dto.relationship_to_couple;
      }
      if (dto.age_group !== undefined) {
        form.age_group = dto.age_group;
      }
      if (dto.has_kids_attending !== undefined) {
        form.has_kids_attending = dto.has_kids_attending;
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

      await this.guestFormRepository.saveEntityWithManager(manager, form);
    });
  }

  private checkOwnership(ownerUserId: number | undefined, userId: number): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Guest does not belong to user',
      });
    }
  }
}