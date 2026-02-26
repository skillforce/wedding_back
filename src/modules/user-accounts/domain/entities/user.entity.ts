import { Column, Entity, OneToMany } from 'typeorm';
import { NumericIdEntity } from '../../../common/domain/base.entity';
import { Length } from 'class-validator';
import { Guest } from '../../../guests/domain/enteties/guest.entity';

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
};
export const passwordConstraints = {
  minLength: 3,
  maxLength: 30,
};

@Entity('Users')
export class User extends NumericIdEntity {
  @Column({ nullable: false })
  @Length(loginConstraints.minLength, loginConstraints.maxLength)
  login: string;

  @Column({ nullable: false })
  @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
  passwordHash: string;

  @Column({ nullable: true })
  invitationUrl?: string;

  @OneToMany(() => Guest, (guest) => guest.user)
  public guests?: Guest[];
}
