import { ApiProperty } from '@nestjs/swagger';
import { GuestsViewDto } from './guests.view-dto';
import { Guest } from '../../domain/enteties/guest.entity';
import { GuestResponse } from '../../domain/enteties/guest-response.entity';
import { GuestForm } from '../../domain/enteties/guest-form.entity';

export class GuestResponseViewDto {
  @ApiProperty({ description: 'Response UUID' })
  id: string;

  @ApiProperty({ type: [String], example: ['wine', 'juice'] })
  preferred_drinks: string[];

  @ApiProperty({ nullable: true, example: 'Vegetarian meal' })
  other_preferences: string | null;

  @ApiProperty({ example: false })
  plus_one: boolean;

  @ApiProperty({ nullable: true, example: 'Jane Doe' })
  plus_one_name: string | null;

  static mapToViewDto(response: GuestResponse): GuestResponseViewDto {
    const dto = new GuestResponseViewDto();
    dto.id = response.id;
    dto.preferred_drinks = response.preferred_drinks;
    dto.other_preferences = response.other_preferences ?? null;
    dto.plus_one = response.plus_one;
    dto.plus_one_name = response.plus_one_name ?? null;
    return dto;
  }
}

export class GuestFormViewDto {
  @ApiProperty({ enum: ['bride_side', 'groom_side', 'mutual'] })
  relationship_to_couple: string;

  @ApiProperty({ enum: ['child', 'young', 'adult', 'old'] })
  age_group: string;

  @ApiProperty()
  has_kids_attending: boolean;

  @ApiProperty({ enum: ['introvert', 'extrovert', 'unknown'] })
  personality_type: string;

  @ApiProperty()
  vip_parents: boolean;

  @ApiProperty()
  vip_grandparents: boolean;

  @ApiProperty()
  vip_relatives: boolean;

  static mapToViewDto(form: GuestForm): GuestFormViewDto {
    const dto = new GuestFormViewDto();
    dto.relationship_to_couple = form.relationship_to_couple;
    dto.age_group = form.age_group;
    dto.has_kids_attending = form.has_kids_attending;
    dto.personality_type = form.personality_type;
    dto.vip_parents = form.vip_parents;
    dto.vip_grandparents = form.vip_grandparents;
    dto.vip_relatives = form.vip_relatives;
    return dto;
  }
}

export class GuestDetailViewDto extends GuestsViewDto {
  @ApiProperty({ type: GuestFormViewDto, nullable: true })
  guestForm: GuestFormViewDto | null;

  @ApiProperty({ type: GuestResponseViewDto, nullable: true })
  response: GuestResponseViewDto | null;

  static mapToDetailViewDto(guest: Guest): GuestDetailViewDto {
    const dto = new GuestDetailViewDto();
    dto.id = guest.id;
    dto.name = guest.guest_name;
    dto.is_already_answered = !!guest.response;
    dto.guestForm = guest.guestForm
      ? GuestFormViewDto.mapToViewDto(guest.guestForm)
      : null;
    dto.response = guest.response
      ? GuestResponseViewDto.mapToViewDto(guest.response)
      : null;
    return dto;
  }
}