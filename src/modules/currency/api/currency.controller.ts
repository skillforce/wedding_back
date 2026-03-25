import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { CurrencyRateQueryRepository } from '../infra/query/currency-rate.query-repository';
import { CurrencyRefreshService } from '../app/services/currency-refresh.service';
import { CurrencyRateViewDto } from './view-dto/currency-rate.view-dto';

@ApiTags('Currency')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('currency')
export class CurrencyController {
  constructor(
    private readonly currencyRateQueryRepository: CurrencyRateQueryRepository,
    private readonly currencyRefreshService: CurrencyRefreshService,
  ) {}

  @Get('rates')
  async getUsdRates(): Promise<CurrencyRateViewDto | null> {
    const result = await this.currencyRateQueryRepository.findLatest();
    if (result) {
      return result;
    }

    await this.currencyRefreshService.refreshRates();
    return this.currencyRateQueryRepository.findLatest();
  }
}