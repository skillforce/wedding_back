import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { Guest } from './guest.entity';

@Entity('Guest_responses')
export class GuestResponse extends UuidEntity {
  @Column({ nullable: false })
  guest_id: string;

  @Column({
    type: 'text',
    array: true,
    nullable: false,
  })
  preferred_drinks: string[];

  @Column({ nullable: true, default: null })
  other_preferences?: string;

  @Column({ nullable: false, default: false })
  plus_one: boolean;

  @Column({ nullable: true, default: null })
  plus_one_name?: string;

  @OneToOne(() => Guest, (guest) => guest.response, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guest_id' })
  guest?: Guest;
}
