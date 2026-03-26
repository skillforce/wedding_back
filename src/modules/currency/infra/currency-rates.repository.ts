import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { CurrencyRate } from '../domain/entities/currency-rate.entity';

@Injectable()
export class CurrencyRatesRepository {
  constructor(
    @InjectRepository(CurrencyRate)
    private readonly ormRepository: Repository<CurrencyRate>,
  ) {}

  async save(data: Omit<CurrencyRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<CurrencyRate> {
    return this.ormRepository.save(data);
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.ormRepository.delete({ createdAt: LessThan(date) });
    return result.affected ?? 0;
  }
}