import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeatingSeat } from '../domain/entities/seating-seat.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class SeatingSeatsRepository {
  constructor(
    @InjectRepository(SeatingSeat)
    private readonly seatsOrmRepository: Repository<SeatingSeat>,
  ) {}

  async save(seat: Omit<SeatingSeat, 'id' | 'table'>): Promise<string> {
    const result = await this.seatsOrmRepository.save(seat);
    return result.id;
  }

  async findByIdOrFail(id: string): Promise<SeatingSeat> {
    const seat = await this.seatsOrmRepository.findOneBy({ id });
    if (!seat) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Seat not found',
      });
    }
    return seat;
  }

  async deleteByIdOrFail(id: string): Promise<void> {
    await this.findByIdOrFail(id);
    await this.seatsOrmRepository.delete(id);
  }
}