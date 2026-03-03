import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';

export class CreateSectionInputDto {
  @ApiProperty({ description: 'Section name', example: 'Организация' })
  @IsString()
  @Trim()
  @Length(1, 50)
  name: string;
}