import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { ChecklistPhase } from './checklist-phase.entity';

export enum ChecklistItemPriority {
  High = 'high',
  Normal = 'normal',
}

@Entity('checklist_items')
@Unique('UQ_checklist_items_phase_id_sort_order', ['phaseId', 'sortOrder'], {
  deferrable: 'INITIALLY DEFERRED',
})
@Index('idx_items_phase', ['phaseId'])
export class ChecklistItem extends UuidEntity {
  @Column({ name: 'phase_id', nullable: false })
  phaseId: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  note: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  comment: string | null;

  @Column({ type: 'boolean', nullable: false, default: false })
  completed: boolean;

  @Column({
    type: 'enum',
    enum: ChecklistItemPriority,
    nullable: false,
    default: ChecklistItemPriority.Normal,
  })
  priority: ChecklistItemPriority;

  @Column({ name: 'sort_order', type: 'int', nullable: false, default: 0 })
  sortOrder: number;

  @ManyToOne(() => ChecklistPhase, (phase) => phase.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phase_id' })
  phase?: ChecklistPhase;
}
