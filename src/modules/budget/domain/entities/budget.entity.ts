import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { NumericIdEntity } from '../../../common/domain/base.entity';
import { User } from '../../../user-accounts/domain/entities/user.entity';
import { BudgetSection } from './budget-section.entity';

import { BudgetCurrency } from './budget-currency.enum';

export { BudgetCurrency };

@Entity('budgets')
export class Budget extends NumericIdEntity {
  @Column({ nullable: false, unique: true })
  userId: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  budgetLimit: number;

  @Column({
    type: 'enum',
    enum: BudgetCurrency,
    nullable: false,
    default: BudgetCurrency.RUB,
  })
  currency: BudgetCurrency;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @OneToMany(() => BudgetSection, (section) => section.budget)
  sections?: BudgetSection[];
}