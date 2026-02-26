import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuestResponse } from '../domain/enteties/guest-response.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class GuestResponseRepository {
  constructor(
    @InjectRepository(GuestResponse)
    private readonly guestResponseOrmRepository: Repository<GuestResponse>,
  ) {}

  async findByGuestId(guestId: string): Promise<GuestResponse | null> {
    return this.guestResponseOrmRepository.findOneBy({ guest_id: guestId });
  }

  async save(response: Omit<GuestResponse, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const result = await this.guestResponseOrmRepository.save(response);
    return result.id;
  }

  async findByIdOrFail(id: string): Promise<GuestResponse> {
    const response = await this.guestResponseOrmRepository.findOneBy({ id });
    if (!response) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Guest response not found',
      });
    }
    return response;
  }

  async deleteById(id: string): Promise<void> {
    await this.guestResponseOrmRepository.delete({ id });
  }

  async deleteByGuestId(guestId: string): Promise<void> {
    await this.guestResponseOrmRepository.delete({ guest_id: guestId });
  }
}