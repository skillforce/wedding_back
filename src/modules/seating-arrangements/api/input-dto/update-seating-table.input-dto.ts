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
    enum: ['circle', 'rect', 'pillar'],
    required: false,
    example: 'rect',
  })
  @IsOptional()
  @IsIn(['circle', 'rect', 'pillar'])
  shape?: string;

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