import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Guest } from '../domain/enteties/guest.entity';
import { Repository } from 'typeorm';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class GuestsRepository {
  constructor(
    @InjectRepository(Guest)
    private readonly guestsOrmRepository: Repository<Guest>,
  ) {}

  async findGuestByName(
    guestName: string,
    userId: number,
  ): Promise<Guest | null> {
    return this.guestsOrmRepository.findOneBy({
      guest_name: guestName,
      user_id: userId,
    });
  }
  async findGuestByIdOrFail(id: number): Promise<Guest> {
    const guestResult = await this.guestsOrmRepository.findOneBy({
      id,
    });
    if (!guestResult) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Guest not found',
      });
    }
    return guestResult;
  }

  async save(guest: Omit<Guest, 'id'>): Promise<number> {
    const result = await this.guestsOrmRepository.save(guest);
    return result.id;
  }
  async deleteGuestByIdOrFail(id: number): Promise<void> {
    await this.guestsOrmRepository.delete(id);
  }
}
