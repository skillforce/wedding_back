import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CoreConfig } from '../../../../core/configs/core.config';
import { CurrencyRatesRepository } from '../../infra/currency-rates.repository';
import { BaseCurrency } from '../../domain/entities/base-currency.enum';

interface ExchangeRateApiResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

@Injectable()
export class CurrencyRefreshService implements OnModuleInit {
  private readonly logger = new Logger(CurrencyRefreshService.name);

  constructor(
    private readonly coreConfig: CoreConfig,
    private readonly currencyRatesRepository: CurrencyRatesRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.refreshRates();
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async refreshRates(): Promise<void> {
    try {
      const response = await fetch(this.generateRequestUrl());

      if (!response.ok) {
        this.logger.error(
          `Exchange rate API returned status ${response.status}`,
        );
        return;
      }

      const data: ExchangeRateApiResponse = await response.json();

      if (data.result !== 'success') {
        this.logger.error(`Exchange rate API error: ${data.result}`);
        return;
      }
      const newCurrencyRate = {
        base: BaseCurrency.USD,
        byn: data.conversion_rates.BYN,
        rub: data.conversion_rates.RUB,
      };

      await this.currencyRatesRepository.save(newCurrencyRate);

      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const deleted = await this.currencyRatesRepository.deleteOlderThan(twoDaysAgo);
      if (deleted > 0) {
        this.logger.log(`Deleted ${deleted} outdated currency rate(s)`);
      }

      this.logger.log('Currency rates refreshed successfully');
    } catch (error) {
      this.logger.error('Failed to refresh currency rates', error);
    }
  }

  private generateRequestUrl(): string {
    const {
      exchangeRateBaseUrl,
      exchangeRateApiKey,
      exchangeRateBaseCurrency,
    } = this.coreConfig;
    return `${exchangeRateBaseUrl}/${exchangeRateApiKey}/latest/${exchangeRateBaseCurrency}`;
  }
}
