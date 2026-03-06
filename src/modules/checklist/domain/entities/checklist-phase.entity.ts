import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { Checklist } from './checklist.entity';
import { ChecklistItem } from './checklist-item.entity';

@Entity('checklist_phases')
@Unique(['checklistId', 'sortOrder'])
@Index('idx_phases_checklist', ['checklistId'])
export class ChecklistPhase extends UuidEntity {
  @Column({ name: 'checklist_id', nullable: false })
  checklistId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timeline: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string | null;

  @Column({ name: 'sort_order', type: 'int', nullable: false, default: 0 })
  sortOrder: number;

  @ManyToOne(() => Checklist, (checklist) => checklist.phases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'checklist_id' })
  checklist?: Checklist;

  @OneToMany(() => ChecklistItem, (item) => item.phase)
  items?: ChecklistItem[];
}
