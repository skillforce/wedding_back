import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeatingArrangement } from '../../domain/entities/seating-arrangement.entity';
import { SeatingArrangementViewDto } from '../../api/view-dto/seating-arrangement.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class SeatingArrangementsQueryRepository {
  constructor(
    @InjectRepository(SeatingArrangement)
    private readonly arrangementOrmRepository: Repository<SeatingArrangement>,
  ) {}

  async findByUserId(userId: number): Promise<SeatingArrangementViewDto> {
    const arrangement = await this.arrangementOrmRepository.findOne({
      where: { user_id: userId },
      relations: ['tables', 'tables.seats', 'tables.seats.guest'],
      order: { tables: { createdAt: 'ASC' } },
    });
    if (!arrangement) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Seating arrangement not found',
      });
    }
    return SeatingArrangementViewDto.mapToViewDto(arrangement);
  }
}