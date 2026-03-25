import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyRate } from '../../domain/entities/currency-rate.entity';
import { CurrencyRateViewDto } from '../../api/view-dto/currency-rate.view-dto';

@Injectable()
export class CurrencyRateQueryRepository {
  constructor(
    @InjectRepository(CurrencyRate)
    private readonly ormRepository: Repository<CurrencyRate>,
  ) {}

  async findLatest(): Promise<CurrencyRateViewDto | null> {
    const entity = await this.ormRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    if (!entity) {
      return null;
    }

    return CurrencyRateViewDto.mapToViewDto(entity);
  }
}
