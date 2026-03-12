import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SeatingTable } from '../domain/entities/seating-table.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class SeatingTablesRepository {
  constructor(
    @InjectRepository(SeatingTable)
    private readonly tablesOrmRepository: Repository<SeatingTable>,
  ) {}

  async findByIdForUpdateOrFail(
    manager: EntityManager,
    id: string,
  ): Promise<SeatingTable> {
    const table = await manager
      .getRepository(SeatingTable)
      .createQueryBuilder('table')
      .innerJoinAndSelect('table.arrangement', 'arrangement')
      .setLock('pessimistic_write')
      .where('table.id = :id', { id })
      .getOne();

    if (!table) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Seating table not found',
      });
    }

    return table;
  }

  async save(
    table: Omit<SeatingTable, 'id' | 'createdAt' | 'arrangement' | 'seats'>,
  ): Promise<string> {
    const result = await this.tablesOrmRepository.save(table);
    return result.id;
  }

  async saveEntityWithManager(
    manager: EntityManager,
    table: SeatingTable,
  ): Promise<void> {
    await manager.getRepository(SeatingTable).save(table);
  }

  async deleteByIdWithManager(
    manager: EntityManager,
    id: string,
  ): Promise<void> {
    await manager.getRepository(SeatingTable).delete({ id });
  }
}