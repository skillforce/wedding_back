import { Column, Entity } from 'typeorm';
import { NumericIdEntity } from '../../../common/domain/base.entity';
import { Length } from 'class-validator';

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
}
