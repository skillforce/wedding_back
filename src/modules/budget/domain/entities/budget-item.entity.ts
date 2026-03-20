import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { NumericIdEntity } from '../../../common/domain/base.entity';
import { BudgetSection } from './budget-section.entity';

export enum BudgetItemPriority {
  MUST = 'must',
  WANT = 'want',
  MAYBE = 'maybe',
}

@Entity('budget_items')
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
    enum: BudgetItemPriority,
    nullable: false,
    default: BudgetItemPriority.MUST,
  })
  priority: BudgetItemPriority;

  @Column({ type: 'boolean', nullable: false, default: false })
  paid: boolean;

  @ManyToOne(() => BudgetSection, (section) => section.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sectionId' })
  section?: BudgetSection;
}