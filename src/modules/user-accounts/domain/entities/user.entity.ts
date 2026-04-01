import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { NumericIdEntity } from '../../../common/domain/base.entity';
import { Length } from 'class-validator';
import { Guest } from '../../../guests/domain/enteties/guest.entity';
import { UserProfile } from './user-profile.entity';

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

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile?: UserProfile;

  @OneToMany(() => Guest, (guest) => guest.user)
  public guests?: Guest[];
}
