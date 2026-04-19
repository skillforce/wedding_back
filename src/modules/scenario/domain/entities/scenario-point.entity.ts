import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { Scenario } from './scenario.entity';

export enum ScenarioPointIcon {
  Breakfast = 'breakfast',
  Cake = 'cake',
  Ceremony = 'ceremony',
  Cocktail = 'cocktail',
  Dinner = 'dinner',
  Dress = 'dress',
  Entrance = 'entrance',
  Exit = 'exit',
  Firework = 'firework',
  First = 'first',
  Ido = 'ido',
  Limo = 'limo',
  Lunch = 'lunch',
  Party = 'party',
  Photo = 'photo',
  Session = 'session',
  SunRise = 'sun-rise',
  Toast = 'toast',
}

@Entity('scenario_points')
@Unique('UQ_scenario_points_scenario_id_time', ['scenarioId', 'time'])
@Index('idx_scenario_points_scenario_id', ['scenarioId'])
export class ScenarioPoint extends UuidEntity {
  @Column({ name: 'scenario_id', nullable: false })
  scenarioId: string;

  @Column({ type: 'char', length: 5, nullable: false })
  time: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 16, nullable: false, default: ScenarioPointIcon.Ceremony })
  icon: ScenarioPointIcon;

  @Column({ type: 'varchar', length: 50, nullable: false, default: '' })
  note: string;

  @Column({ type: 'integer', nullable: true, default: null })
  duration: number | null;

  @ManyToOne(() => Scenario, (scenario) => scenario.points, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scenario_id' })
  scenario?: Scenario;
}