import { ApiProperty } from '@nestjs/swagger';
import { Guest } from '../../domain/enteties/guest.entity';

export class GuestsViewDto {
  @ApiProperty({ description: 'Guest ID', example: 'uuid-...' })
  id: string;

  @ApiProperty({ description: 'Guest name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Whether the guest has already submitted a response', example: false })
  is_already_answered: boolean;

  static mapToViewDto(guest: Guest): GuestsViewDto {
    const dto = new GuestsViewDto();

    dto.id = guest.id;
    dto.name = guest.guest_name;
    dto.is_already_answered = !!guest.response;
    return dto;
  }
}
