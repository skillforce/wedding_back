import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { User } from './user.entity';

@Entity('auth_sessions')
@Index(['userId', 'deviceId'])
export class AuthSession extends UuidEntity {
  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  refreshTokenHash: string;

  @Column({ nullable: false })
  expiresAt: Date;

  @Column({ nullable: false })
  deviceId: string;

  @Column({ length: 512, nullable: false })
  userAgent: string;

  @Column({ nullable: true, type: 'varchar' })
  deviceName: string | null;

  @Column({ nullable: false })
  lastActiveAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}