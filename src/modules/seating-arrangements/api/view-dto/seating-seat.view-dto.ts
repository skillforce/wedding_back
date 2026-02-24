import { ApiProperty } from '@nestjs/swagger';
import { SeatingSeat } from '../../domain/entities/seating-seat.entity';

export class SeatingSeatViewDto {
  @ApiProperty({ description: 'Seat UUID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Seat label or name', example: 'Seat A1' })
  name: string;

  static mapToViewDto(seat: SeatingSeat): SeatingSeatViewDto {
    const dto = new SeatingSeatViewDto();
    dto.id = seat.id;
    dto.name = seat.name;
    return dto;
  }
}