import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeatingSeat } from '../../domain/entities/seating-seat.entity';
import { SeatingSeatViewDto } from '../../api/view-dto/seating-seat.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class SeatingSeatsQueryRepository {
  constructor(
    @InjectRepository(SeatingSeat)
    private readonly seatsOrmRepository: Repository<SeatingSeat>,
  ) {}

  async findByIdOrFail(id: string): Promise<SeatingSeatViewDto> {
    const seat = await this.seatsOrmRepository.findOneBy({ id });
    if (!seat) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Seat not found',
      });
    }
    return SeatingSeatViewDto.mapToViewDto(seat);
  }
}