import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  workspaceConstraints,
  workspaceShapeValues,
  WorkspaceShape,
} from '../../domain/entities/seating-arrangement.entity';

export class UpdateSeatingArrangementInputDto {
  @ApiProperty({
    description: 'Workspace shape',
    enum: workspaceShapeValues,
    required: false,
    example: 'rect',
  })
  @IsOptional()
  @IsIn(workspaceShapeValues)
  shape?: WorkspaceShape;

  @ApiProperty({
    description: `Workspace width in px (${workspaceConstraints.minWidth}–${workspaceConstraints.maxWidth})`,
    required: false,
    example: 1600,
  })
  @IsOptional()
  @IsInt()
  @Min(workspaceConstraints.minWidth)
  @Max(workspaceConstraints.maxWidth)
  width?: number;

  @ApiProperty({
    description: `Workspace height in px (${workspaceConstraints.minHeight}–${workspaceConstraints.maxHeight})`,
    required: false,
    example: 900,
  })
  @IsOptional()
  @IsInt()
  @Min(workspaceConstraints.minHeight)
  @Max(workspaceConstraints.maxHeight)
  height?: number;

  @ApiProperty({
    description: `Maximum number of tables allowed (1–${workspaceConstraints.maxTablesAmount})`,
    required: false,
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(workspaceConstraints.maxTablesAmount)
  max_tables_amount?: number;

  @ApiProperty({
    description: `Maximum seats per table allowed (1–${workspaceConstraints.maxSeatsPerTableAmount})`,
    required: false,
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(workspaceConstraints.maxSeatsPerTableAmount)
  max_seats_per_table_amount?: number;
}