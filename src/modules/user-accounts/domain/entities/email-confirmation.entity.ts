import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { User } from './user.entity';

@Entity('email_confirmations')
export class EmailConfirmation extends UuidEntity {
  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false, unique: true })
  @Index()
  token: string;

  @Column({ nullable: false })
  email: string;

  @Column({ nullable: false })
  expiresAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  confirmedAt: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}