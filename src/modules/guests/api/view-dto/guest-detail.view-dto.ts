import { ApiProperty } from '@nestjs/swagger';
import { GuestsViewDto } from './guests.view-dto';
import { Guest } from '../../domain/enteties/guest.entity';
import { GuestResponse } from '../../domain/enteties/guest-response.entity';

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

export class GuestDetailViewDto extends GuestsViewDto {
  @ApiProperty({ type: GuestResponseViewDto, nullable: true })
  response: GuestResponseViewDto | null;

  static mapToDetailViewDto(guest: Guest): GuestDetailViewDto {
    const dto = new GuestDetailViewDto();
    dto.id = guest.id;
    dto.name = guest.guest_name;
    dto.is_already_answered = !!guest.response;
    dto.response = guest.response
      ? GuestResponseViewDto.mapToViewDto(guest.response)
      : null;
    return dto;
  }
}