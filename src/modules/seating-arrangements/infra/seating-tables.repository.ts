import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeatingTable } from '../domain/entities/seating-table.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class SeatingTablesRepository {
  constructor(
    @InjectRepository(SeatingTable)
    private readonly tablesOrmRepository: Repository<SeatingTable>,
  ) {}

  async findByIdAndUserIdOrFail(id: string, userId: number): Promise<SeatingTable> {
    const table = await this.tablesOrmRepository.findOneBy({ id, user_id: userId });
    if (!table) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Seating table not found',
      });
    }
    return table;
  }

  async save(table: Omit<SeatingTable, 'id' | 'user' | 'seats'>): Promise<string> {
    const result = await this.tablesOrmRepository.save(table);
    return result.id;
  }

  async update(id: string, updates: Partial<SeatingTable>): Promise<void> {
    await this.tablesOrmRepository.update(id, updates);
  }

  async deleteByIdOrFail(id: string): Promise<void> {
    await this.tablesOrmRepository.delete(id);
  }
}