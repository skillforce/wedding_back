import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeatingTable } from '../../domain/entities/seating-table.entity';
import { SeatingTableViewDto } from '../../api/view-dto/seating-table.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class SeatingTablesQueryRepository {
  constructor(
    @InjectRepository(SeatingTable)
    private readonly tablesOrmRepository: Repository<SeatingTable>,
  ) {}

  async findAllByUserId(userId: number): Promise<SeatingTableViewDto[]> {
    const tables = await this.tablesOrmRepository.find({
      where: { user_id: userId },
      relations: ['seats'],
      order: { createdAt: 'ASC' },
    });
    return tables.map(SeatingTableViewDto.mapToViewDto);
  }

  async findByIdOrFail(id: string): Promise<SeatingTableViewDto> {
    const table = await this.tablesOrmRepository.findOne({
      where: { id },
      relations: ['seats'],
    });
    if (!table) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Seating table not found',
      });
    }
    return SeatingTableViewDto.mapToViewDto(table);
  }
}