import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../../user-accounts/domain/entities/user.entity';
import { SeatingSeat } from './seating-seat.entity';
import { UuidEntity } from '../../../common/domain/base.entity';

export type TablePosition = { x: number; y: number };

@Entity('seating_tables')
export class SeatingTable extends UuidEntity {
  @Column({ nullable: false })
  user_id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'jsonb', nullable: false })
  position: TablePosition;

  @Column({ type: 'varchar', length: 8, nullable: false, default: 'circle' })
  shape: string;

  @Column({ type: 'float', nullable: false, default: 0 })
  rotation: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => SeatingSeat, (seat) => seat.table, { cascade: true })
  seats?: SeatingSeat[];
}