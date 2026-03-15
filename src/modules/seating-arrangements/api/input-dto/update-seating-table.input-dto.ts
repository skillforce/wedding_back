import {
  IsIn,
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
import { TablePositionDto } from './create-seating-table.input-dto';
import { TableShape } from '../../domain/entities/seating-table.entity';

export class UpdateSeatingTableInputDto {
  @ApiProperty({ description: 'Name of the table', required: false, example: 'Table 1' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Position of the table on the seating map', required: false, type: TablePositionDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TablePositionDto)
  position?: TablePositionDto;

  @ApiProperty({
    description: 'Shape of the table',
    enum: TableShape,
    required: false,
    example: TableShape.Rect,
  })
  @IsOptional()
  @IsIn(Object.values(TableShape))
  shape?: TableShape;

  @ApiProperty({
    description: 'Rotation angle of the table in degrees',
    required: false,
    example: 90,
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