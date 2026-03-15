import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TableShape } from '../../domain/entities/seating-table.entity';

export class TablePositionDto {
  @ApiProperty({ description: 'X coordinate of the table placement', example: 100 })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Y coordinate of the table placement', example: 200 })
  @IsNumber()
  y: number;
}

export class CreateSeatingTableInputDto {
  @ApiProperty({ description: 'Name of the table', example: 'Table 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Position of the table on the seating map', type: TablePositionDto })
  @IsObject()
  @ValidateNested()
  @Type(() => TablePositionDto)
  position: TablePositionDto;

  @ApiProperty({
    description: 'Shape of the table',
    enum: TableShape,
    required: false,
    example: TableShape.Circle,
  })
  @IsOptional()
  @IsIn(Object.values(TableShape))
  shape?: TableShape;

  @ApiProperty({
    description: 'Rotation angle of the table in degrees',
    required: false,
    example: 45,
  })
  @IsOptional()
  @IsNumber()
  rotation?: number;

  @ApiProperty({
    description: 'Radius of the table object (40–120)',
    required: false,
    example: 70,
  })
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(120)
  radius?: number;

}