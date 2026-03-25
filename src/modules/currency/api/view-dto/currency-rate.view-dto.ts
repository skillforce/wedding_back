import { ApiProperty } from '@nestjs/swagger';
import { CurrencyRate } from '../../domain/entities/currency-rate.entity';
import { BaseCurrency } from '../../domain/entities/base-currency.enum';

export class CurrencyRateViewDto {
  @ApiProperty({ example: BaseCurrency.USD, enum: BaseCurrency })
  base: BaseCurrency;

  @ApiProperty({
    example: { BYN: 3.25, RUB: 96.5 },
  })
  rates: {
    BYN: number;
    RUB: number;
  };

  @ApiProperty({ example: '2026-03-25T10:00:00.000Z' })
  updatedAt: string;

  static mapToViewDto(entity: CurrencyRate): CurrencyRateViewDto {
    const dto = new CurrencyRateViewDto();
    dto.base = BaseCurrency.USD;
    dto.rates = {
      BYN: Number(entity.byn),
      RUB: Number(entity.rub),
    };
    dto.updatedAt = entity.createdAt!.toISOString();
    return dto;
  }
}
