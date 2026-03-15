import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { SeatingArrangement } from './seating-arrangement.entity';
import { SeatingSeat } from './seating-seat.entity';
import { UuidEntity } from '../../../common/domain/base.entity';

export type TablePosition = { x: number; y: number };

export enum TableShape {
  Circle = 'circle',
  Rect = 'rect',
  Pillar = 'pillar',
}

@Entity('seating_tables')
export class SeatingTable extends UuidEntity {
  @Column({ type: 'uuid', nullable: false })
  arrangement_id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: 'jsonb', nullable: false })
  position: TablePosition;

  @Column({
    type: 'varchar',
    enum: TableShape,
    nullable: false,
    default: TableShape.Circle,
  })
  shape: TableShape;

  @Column({ type: 'float', nullable: false, default: 0 })
  rotation: number;

  @Column({ type: 'int', nullable: false, default: 70 })
  radius: number;

  @ManyToOne(() => SeatingArrangement, (arrangement) => arrangement.tables, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'arrangement_id' })
  arrangement?: SeatingArrangement;

  @OneToMany(() => SeatingSeat, (seat) => seat.table, { cascade: true })
  seats?: SeatingSeat[];
}
