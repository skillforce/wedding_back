import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { User } from './user.entity';

@Entity('UserProfiles')
export class UserProfile extends UuidEntity {
  @Column({ nullable: true })
  invitationUrl: string;

  @Column({ nullable: true })
  profileImg: string;

  @Column({ nullable: true, type: 'timestamptz' })
  weddingDate: Date;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: 0 })
  dailyImageUploadCount: number;

  @Column({ nullable: true, type: 'date' })
  imageUploadResetDate: Date;

  @Column()
  userId: number;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'userId' })
  user: User;
}