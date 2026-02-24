import { ApiProperty } from '@nestjs/swagger';
import { Guest } from '../../domain/enteties/guest.entity';

export class GuestsViewDto {
  @ApiProperty({ description: 'Guest ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Guest name', example: 'John Doe' })
  name: string;

  @ApiProperty({
    description: 'List of preferred drinks',
    type: [String],
    example: ['wine', 'juice'],
  })
  preferred_drinks: string[];

  @ApiProperty({
    description: 'Additional preferences or notes',
    required: false,
    example: 'Vegetarian meal',
  })
  other_preferences?: string;

  static mapToViewDto(guest: Guest): GuestsViewDto {
    const dto = new GuestsViewDto();

    dto.id = guest.id;
    dto.name = guest.guest_name;
    dto.preferred_drinks = guest.preferred_drinks;
    dto.other_preferences = guest.other_preferences;
    return dto;
  }
}