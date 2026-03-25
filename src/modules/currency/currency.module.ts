import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CurrencyRate } from './domain/entities/currency-rate.entity';
import { CurrencyController } from './api/currency.controller';
import { CurrencyRatesRepository } from './infra/currency-rates.repository';
import { CurrencyRateQueryRepository } from './infra/query/currency-rate.query-repository';
import { CurrencyRefreshService } from './app/services/currency-refresh.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CurrencyRate]),
    ScheduleModule.forRoot(),
  ],
  controllers: [CurrencyController],
  providers: [
    CurrencyRatesRepository,
    CurrencyRateQueryRepository,
    CurrencyRefreshService,
  ],
})
export class CurrencyModule {}