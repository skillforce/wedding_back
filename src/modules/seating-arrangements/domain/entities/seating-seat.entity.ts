import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { SeatingTable } from './seating-table.entity';
import { UuidEntity } from '../../../common/domain/base.entity';
import { Guest } from '../../../guests/domain/enteties/guest.entity';

@Entity('seating_seats')
export class SeatingSeat extends UuidEntity {
  @Column({ type: 'uuid', nullable: false })
  table_id: string;

  @Column({ type: 'uuid', nullable: false, unique: true })
  guest_id: string;

  @ManyToOne(() => SeatingTable, (table) => table.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table?: SeatingTable;

  @OneToOne(() => Guest, (guest) => guest.seat, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guest_id' })
  guest?: Guest;
}