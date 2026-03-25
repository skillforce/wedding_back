import { Column, Entity } from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { BaseCurrency } from './base-currency.enum';

@Entity('currency_rates')
export class CurrencyRate extends UuidEntity {
  @Column({ type: 'enum', enum: BaseCurrency, default: BaseCurrency.USD })
  base: BaseCurrency;

  @Column({ type: 'decimal', precision: 12, scale: 6 })
  byn: number;

  @Column({ type: 'decimal', precision: 12, scale: 6 })
  rub: number;
}