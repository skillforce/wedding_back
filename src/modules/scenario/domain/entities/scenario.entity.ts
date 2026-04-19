import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { User } from '../../../user-accounts/domain/entities/user.entity';
import { ScenarioPoint } from './scenario-point.entity';

@Entity('scenarios')
export class Scenario extends UuidEntity {
  @Column({ name: 'user_id', nullable: false, unique: true })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => ScenarioPoint, (point) => point.scenario)
  points?: ScenarioPoint[];
}