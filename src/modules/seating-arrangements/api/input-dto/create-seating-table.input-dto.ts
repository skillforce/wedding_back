import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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
    enum: ['circle', 'rect'],
    required: false,
    example: 'circle',
  })
  @IsOptional()
  @IsIn(['circle', 'rect'])
  shape?: string;

  @ApiProperty({
    description: 'Rotation angle of the table in degrees',
    required: false,
    example: 45,
  })
  @IsOptional()
  @IsNumber()
  rotation?: number;

}