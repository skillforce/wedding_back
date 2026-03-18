import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { GuestForm } from '../domain/enteties/guest-form.entity';
import { GuestFormInputDto } from '../api/input-dto/guest.input-dto';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class GuestFormRepository {
  constructor(
    @InjectRepository(GuestForm)
    private readonly guestFormOrmRepository: Repository<GuestForm>,
  ) {}

  async save(guestId: string, dto: GuestFormInputDto): Promise<void> {
    const { ifWithCouple, ...rest } = dto;
    await this.guestFormOrmRepository.save({
      ...rest,
      guest_id: guestId,
      if_with_couple_response: ifWithCouple?.response ?? false,
      if_with_couple_couple_id: ifWithCouple?.coupleId ?? null,
    });
  }

  async findByGuestIdForUpdateOrFail(
    manager: EntityManager,
    guestId: string,
  ): Promise<GuestForm> {
    const form = await manager
      .getRepository(GuestForm)
      .createQueryBuilder('guestForm')
      .innerJoinAndSelect('guestForm.guest', 'guest')
      .setLock('pessimistic_write')
      .where('guestForm.guest_id = :guestId', { guestId })
      .getOne();

    if (!form) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Guest form not found',
      });
    }

    return form;
  }

  async saveEntityWithManager(
    manager: EntityManager,
    form: GuestForm,
  ): Promise<void> {
    await manager.getRepository(GuestForm).save(form);
  }
}