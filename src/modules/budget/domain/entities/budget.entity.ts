import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { NumericIdEntity } from '../../../common/domain/base.entity';
import { User } from '../../../user-accounts/domain/entities/user.entity';
import { BudgetSection } from './budget-section.entity';

import { BaseCurrency } from '../../../currency/domain/entities/base-currency.enum';

@Entity('budgets')
export class Budget extends NumericIdEntity {
  @Column({ nullable: false, unique: true })
  userId: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  budgetLimit: number;

  @Column({
    type: 'enum',
    enum: BaseCurrency,
    nullable: false,
    default: BaseCurrency.RUB,
  })
  currency: BaseCurrency;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @OneToMany(() => BudgetSection, (section) => section.budget)
  sections?: BudgetSection[];
}