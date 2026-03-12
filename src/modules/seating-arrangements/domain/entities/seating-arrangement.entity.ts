import { Check, Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../../user-accounts/domain/entities/user.entity';
import { SeatingTable } from './seating-table.entity';
import { UuidEntity } from '../../../common/domain/base.entity';

export const workspaceShapeValues = ['rect', 'circle'] as const;
export type WorkspaceShape = (typeof workspaceShapeValues)[number];

export const workspaceConstraints = {
  minWidth: 1600,
  maxWidth: 2720,
  minHeight: 900,
  maxHeight: 1530,
  maxTablesAmount: 40,
  maxSeatsPerTableAmount: 30,
};

@Check(`"max_tables_amount" >= 1 AND "max_tables_amount" <= ${workspaceConstraints.maxTablesAmount}`)
@Check(`"max_seats_per_table_amount" >= 1 AND "max_seats_per_table_amount" <= ${workspaceConstraints.maxSeatsPerTableAmount}`)
@Entity('seating_arrangements')
export class SeatingArrangement extends UuidEntity {
  @Column({ nullable: false, unique: true })
  user_id: number;

  @Column({ type: 'varchar', length: 16, nullable: false, default: 'rect' })
  shape: WorkspaceShape;

  @Column({ type: 'int', nullable: false, default: workspaceConstraints.minWidth })
  width: number;

  @Column({ type: 'int', nullable: false, default: workspaceConstraints.minHeight })
  height: number;

  @Column({ type: 'int', nullable: false, default: 20 })
  max_tables_amount: number;

  @Column({ type: 'int', nullable: false, default: 20 })
  max_seats_per_table_amount: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => SeatingTable, (table) => table.arrangement)
  tables?: SeatingTable[];
}