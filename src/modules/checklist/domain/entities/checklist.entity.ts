import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { User } from '../../../user-accounts/domain/entities/user.entity';
import { ChecklistPhase } from './checklist-phase.entity';

@Entity('checklists')
export class Checklist extends UuidEntity {
  @Column({ name: 'user_id', nullable: false, unique: true })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => ChecklistPhase, (phase) => phase.checklist)
  phases?: ChecklistPhase[];
}
