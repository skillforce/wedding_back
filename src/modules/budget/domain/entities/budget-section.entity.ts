import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { NumericIdEntity } from '../../../common/domain/base.entity';
import { Budget } from './budget.entity';
import { BudgetItem } from './budget-item.entity';

@Entity('budget_sections')
@Unique(['budgetId', 'name'])
export class BudgetSection extends NumericIdEntity {
  @Column({ nullable: false })
  budgetId: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  name: string;

  @ManyToOne(() => Budget, (budget) => budget.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budgetId' })
  budget?: Budget;

  @OneToMany(() => BudgetItem, (item) => item.section)
  items?: BudgetItem[];
}