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

  async findGuestByIdOrFail(id: string): Promise<Guest> {
    const guest = await this.guestsOrmRepository.findOneBy({ id });
    if (!guest) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Guest not found',
      });
    }
    return guest;
  }

  async findGuestByName(
    guestName: string,
    userId: number,
  ): Promise<Guest | null> {
    return this.guestsOrmRepository.findOneBy({
      guest_name: guestName,
      user_id: userId,
    });
  }
  async findGuestByIdAndUserOwnerIdOrFail(
    id: string,
    userId: number,
  ): Promise<Guest> {
    const guestResult = await this.guestsOrmRepository.findOneBy({
      id,
      user_id: userId,
    });
    if (!guestResult) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Guest not found',
      });
    }
    return guestResult;
  }

  async save(guest: Omit<Guest, 'id'>): Promise<string> {
    const result = await this.guestsOrmRepository.save(guest);
    return result.id;
  }
  async deleteGuestByIdOrFail(id: string): Promise<void> {
    await this.guestsOrmRepository.delete(id);
  }
}
