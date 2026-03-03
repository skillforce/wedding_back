import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';

export class UpdateSectionInputDto {
  @ApiProperty({
    description: 'Section name',
    example: 'Банкет',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Trim()
  @Length(1, 50)
  name?: string;
}