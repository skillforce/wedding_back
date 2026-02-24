import { ApiProperty } from '@nestjs/swagger';
import {
  SeatingTable,
  TablePosition,
} from '../../domain/entities/seating-table.entity';
import { SeatingSeatViewDto } from './seating-seat.view-dto';

export class SeatingTableViewDto {
  @ApiProperty({
    description: 'Table UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({ description: 'Table name', example: 'Table 1' })
  name: string;

  @ApiProperty({ description: 'Position of the table on the seating map' })
  position: TablePosition;

  @ApiProperty({
    description: 'Shape of the table',
    enum: ['circle', 'rect'],
    example: 'circle',
  })
  shape: string;

  @ApiProperty({ description: 'Rotation angle in degrees', example: 0 })
  rotation: number;

  @ApiProperty({ description: 'Date the table was created' })
  createdAt: Date;

  @ApiProperty({
    description: 'Seats assigned to this table',
    type: [SeatingSeatViewDto],
  })
  seats: SeatingSeatViewDto[];

  static mapToViewDto(table: SeatingTable): SeatingTableViewDto {
    const dto = new SeatingTableViewDto();
    dto.id = table.id;
    dto.name = table.name;
    dto.position = table.position;
    dto.shape = table.shape;
    dto.rotation = table.rotation;
    dto.createdAt = table.createdAt!;
    dto.seats = (table.seats ?? []).map(SeatingSeatViewDto.mapToViewDto);
    return dto;
  }
}
