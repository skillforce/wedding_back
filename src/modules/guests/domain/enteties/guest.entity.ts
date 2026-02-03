import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { NumericIdEntity } from '../../../common/domain/base.entity';
import { Length } from 'class-validator';
import { User } from '../../../user-accounts/domain/entities/user.entity';

export const guestNameConstraints = {
  minLength: 3,
  maxLength: 20,
};

@Entity('Guests')
export class Guest extends NumericIdEntity {
  @Column({ nullable: false })
  user_id: number;

  @Column({ nullable: false })
  @Length(guestNameConstraints.minLength, guestNameConstraints.maxLength)
  guest_name: string;

  @Column({
    type: 'text',
    array: true,
    nullable: false,
  })
  preferred_drinks: string[];

  @Column({ nullable: true, default: null })
  other_preferences?: string;

  @ManyToOne(() => User, (user) => user.guests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
