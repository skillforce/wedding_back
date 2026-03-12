import { ApiProperty } from '@nestjs/swagger';
import {
  SeatingArrangement,
  WorkspaceShape,
} from '../../domain/entities/seating-arrangement.entity';
import { SeatingTableViewDto } from './seating-table.view-dto';

export class SeatingArrangementViewDto {
  @ApiProperty({ description: 'Workspace shape', enum: ['rect', 'circle'], example: 'rect' })
  shape: WorkspaceShape;

  @ApiProperty({ description: 'Workspace width in px', example: 1600 })
  width: number;

  @ApiProperty({ description: 'Workspace height in px', example: 900 })
  height: number;

  @ApiProperty({ description: 'Maximum number of tables allowed', example: 20 })
  max_tables_amount: number;

  @ApiProperty({ description: 'Maximum seats per table allowed', example: 20 })
  max_seats_per_table_amount: number;

  @ApiProperty({ description: 'Seating tables', type: [SeatingTableViewDto] })
  items: SeatingTableViewDto[];

  static mapToViewDto(arrangement: SeatingArrangement): SeatingArrangementViewDto {
    const dto = new SeatingArrangementViewDto();
    dto.shape = arrangement.shape;
    dto.width = arrangement.width;
    dto.height = arrangement.height;
    dto.max_tables_amount = arrangement.max_tables_amount;
    dto.max_seats_per_table_amount = arrangement.max_seats_per_table_amount;
    dto.items = (arrangement.tables ?? []).map(SeatingTableViewDto.mapToViewDto);
    return dto;
  }
}