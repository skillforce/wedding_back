import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { SeatingTable } from './seating-table.entity';
import { UuidEntity } from '../../../common/domain/base.entity';

@Entity('seating_seats')
export class SeatingSeat extends UuidEntity {
  @Column({ type: 'uuid', nullable: false })
  table_id: string;

  @Column({ nullable: false })
  name: string;

  @ManyToOne(() => SeatingTable, (table) => table.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table?: SeatingTable;
}