import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { UuidEntity } from '../../../common/domain/base.entity';
import { Guest } from './guest.entity';

export const RELATIONSHIP_TO_COUPLE_VALUES = [
  'bride_side',
  'groom_side',
  'mutual',
] as const;
export const AGE_GROUPS = ['child', 'young', 'adult', 'old'] as const;
export const PERSONALITY_TYPES = ['introvert', 'extrovert', 'unknown'] as const;

export type RelationshipToCouple =
  (typeof RELATIONSHIP_TO_COUPLE_VALUES)[number];
export type AgeGroup = (typeof AGE_GROUPS)[number];
export type PersonalityType = (typeof PERSONALITY_TYPES)[number];

@Entity('Guest_forms')
export class GuestForm extends UuidEntity {
  @Column({ nullable: false })
  guest_id: string;

  @Column({ nullable: false })
  relationship_to_couple: RelationshipToCouple;

  @Column({ nullable: false })
  age_group: AgeGroup;

  @Column({ nullable: false, default: false })
  has_kids_attending: boolean;

  @Column({ type: 'int', nullable: true, default: null })
  amount_of_kids: number | null;

  @Column({ nullable: false })
  personality_type: PersonalityType;

  @Column({ nullable: false, default: false })
  vip_parents: boolean;

  @Column({ nullable: false, default: false })
  vip_grandparents: boolean;

  @Column({ nullable: false, default: false })
  vip_relatives: boolean;

  @OneToOne(() => Guest, (guest) => guest.guestForm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'guest_id' })
  guest?: Guest;
}
