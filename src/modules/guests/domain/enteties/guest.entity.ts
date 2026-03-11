import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { Length } from 'class-validator';
import { User } from '../../../user-accounts/domain/entities/user.entity';
import { GuestResponse } from './guest-response.entity';
import { GuestForm } from './guest-form.entity';
import { SeatingSeat } from '../../../seating-arrangements/domain/entities/seating-seat.entity';

export const guestNameConstraints = {
  minLength: 3,
  maxLength: 20,
};

@Entity('Guests')
export class Guest extends UuidEntity {
  @Column({ nullable: false })
  user_id: number;

  @Column({ nullable: false })
  @Length(guestNameConstraints.minLength, guestNameConstraints.maxLength)
  guest_name: string;

  @ManyToOne(() => User, (user) => user.guests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToOne(() => GuestResponse, (response) => response.guest)
  response?: GuestResponse;

  @OneToOne(() => GuestForm, (form) => form.guest)
  guestForm?: GuestForm;

  @OneToOne(() => SeatingSeat, (seat) => seat.guest)
  seat?: SeatingSeat;
}
