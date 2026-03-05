import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SeatingSeat } from '../domain/entities/seating-seat.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class SeatingSeatsRepository {
  constructor(
    @InjectRepository(SeatingSeat)
    private readonly seatsOrmRepository: Repository<SeatingSeat>,
  ) {}

  async saveWithManager(
    manager: EntityManager,
    seat: Omit<SeatingSeat, 'id' | 'table'>,
  ): Promise<string> {
    const result = await manager.getRepository(SeatingSeat).save(seat);
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

  async findByIdAndTableIdForUpdateOrFail(
    manager: EntityManager,
    id: string,
    tableId: string,
  ): Promise<SeatingSeat> {
    const seat = await manager
      .getRepository(SeatingSeat)
      .createQueryBuilder('seat')
      .setLock('pessimistic_write')
      .where('seat.id = :id', { id })
      .andWhere('seat.table_id = :tableId', { tableId })
      .getOne();

    if (!seat) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Seat not found',
      });
    }

    return seat;
  }

  async deleteByIdWithManager(
    manager: EntityManager,
    id: string,
  ): Promise<void> {
    await manager.getRepository(SeatingSeat).delete({ id });
  }
}
