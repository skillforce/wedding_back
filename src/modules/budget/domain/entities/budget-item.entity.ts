import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { NumericIdEntity } from '../../../common/domain/base.entity';
import { BudgetSection } from './budget-section.entity';
import { BudgetCurrency } from './budget-currency.enum';

export enum BudgetItemPriority {
  MUST = 'must',
  WANT = 'want',
  MAYBE = 'maybe',
}

@Entity('budget_items')
@Unique('UQ_budget_items_section_id_sort_order', ['sectionId', 'sortOrder'], {
  deferrable: 'INITIALLY DEFERRED',
})
@Index('idx_budget_items_section_id', ['sectionId'])
export class BudgetItem extends NumericIdEntity {
  @Column({ nullable: false })
  sectionId: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  name: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  estimatedCost: number;

  @Column({ type: 'int', nullable: true })
  actualCost: number | null;

  @Column({ type: 'int', nullable: true })
  deposit: number | null;

  @Column({
    type: 'enum',
    enum: BudgetCurrency,
    nullable: false,
    default: BudgetCurrency.USD,
  })
  currency: BudgetCurrency;

  @Column({
    type: 'enum',
    enum: BudgetItemPriority,
    nullable: false,
    default: BudgetItemPriority.MUST,
  })
  priority: BudgetItemPriority;

  @Column({ type: 'boolean', nullable: false, default: false })
  paid: boolean;

  @Column({ type: 'int', nullable: false, default: 0 })
  sortOrder: number;

  @ManyToOne(() => BudgetSection, (section) => section.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sectionId' })
  section?: BudgetSection;
}
