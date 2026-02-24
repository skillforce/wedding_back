import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
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
    enum: ['circle', 'rect'],
    required: false,
    example: 'rect',
  })
  @IsOptional()
  @IsIn(['circle', 'rect'])
  shape?: string;

  @ApiProperty({
    description: 'Rotation angle of the table in degrees',
    required: false, 
    example: 90,
  })
  @IsOptional()
  @IsNumber()
  rotation?: number;

}