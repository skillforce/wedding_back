import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { User } from './user.entity';
import { ConfirmationType } from './confirmation-type.enum';

@Entity('confirmations')
export class Confirmation extends UuidEntity {
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

  @Column({ nullable: false, default: ConfirmationType.EMAIL_CONFIRMATION })
  type: ConfirmationType;

  @ManyToOne(() => User, (user) => user.confirmations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}

export { ConfirmationType };