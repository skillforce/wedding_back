import { ApiProperty } from '@nestjs/swagger';
import { SeatingSeat } from '../../domain/entities/seating-seat.entity';

export class SeatingSeatViewDto {
  @ApiProperty({ description: 'Seat UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Assigned guest UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  guest_id: string;

  @ApiProperty({ description: 'Guest name', example: 'John Doe' })
  name: string;

  static mapToViewDto(seat: SeatingSeat): SeatingSeatViewDto {
    const dto = new SeatingSeatViewDto();
    dto.id = seat.id;
    dto.guest_id = seat.guest_id;
    dto.name = seat.guest!.guest_name;
    return dto;
  }
}