import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SeatingArrangement } from '../domain/entities/seating-arrangement.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class SeatingArrangementsRepository {
  constructor(
    @InjectRepository(SeatingArrangement)
    private readonly arrangementOrmRepository: Repository<SeatingArrangement>,
  ) {}

  async save(
    data: Omit<SeatingArrangement, 'id' | 'createdAt' | 'user' | 'tables'>,
  ): Promise<string> {
    const result = await this.arrangementOrmRepository.save(data);
    return result.id;
  }

  async findByUserIdForUpdateOrFail(
    manager: EntityManager,
    userId: number,
  ): Promise<SeatingArrangement> {
    const arrangement = await manager
      .getRepository(SeatingArrangement)
      .createQueryBuilder('arrangement')
      .setLock('pessimistic_write')
      .where('arrangement.user_id = :userId', { userId })
      .getOne();

    if (!arrangement) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Seating arrangement not found',
      });
    }

    return arrangement;
  }

  async saveEntityWithManager(
    manager: EntityManager,
    arrangement: SeatingArrangement,
  ): Promise<void> {
    await manager.getRepository(SeatingArrangement).save(arrangement);
  }

  async findByUserIdOrFail(userId: number): Promise<SeatingArrangement> {
    const arrangement = await this.arrangementOrmRepository.findOneBy({ user_id: userId });
    if (!arrangement) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Seating arrangement not found',
      });
    }
    return arrangement;
  }
}