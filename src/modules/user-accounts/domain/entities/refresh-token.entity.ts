import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { User } from './user.entity';

@Entity('RefreshTokens')
export class RefreshToken extends UuidEntity {
  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false })
  tokenHash: string;

  @Column({ nullable: false })
  expiresAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}