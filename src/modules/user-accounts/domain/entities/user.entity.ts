import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { NumericIdEntity } from '../../../common/domain/base.entity';
import { Length } from 'class-validator';
import { Guest } from '../../../guests/domain/enteties/guest.entity';
import { UserProfile } from './user-profile.entity';
import { UserRole } from './user-role.enum';
import { UserStatus } from './user-status.enum';

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

  @Column({ type: 'varchar', default: UserRole.PLAIN_USER })
  role: UserRole;

  @Column({ type: 'varchar', default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true, type: 'int' })
  createdByUserId: number | null;

  @ManyToOne(() => User, (u) => u.createdUsers, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: User | null;

  @OneToMany(() => User, (u) => u.createdBy)
  createdUsers?: User[];

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile?: UserProfile;

  @OneToMany(() => Guest, (guest) => guest.user)
  public guests?: Guest[];
}
