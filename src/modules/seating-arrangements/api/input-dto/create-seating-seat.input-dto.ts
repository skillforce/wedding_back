import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSeatingSeatInputDto {
  @ApiProperty({ description: 'Seat label or name', example: 'Seat A1' })
  @IsString()
  @IsNotEmpty()
  name: string;
}