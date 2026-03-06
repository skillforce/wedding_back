import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';
import { TrimAndNullifyEmpty } from '../../../../core/decorators/transform/trim-and-nullify-empty';

export class CreatePhaseInputDto {
  @ApiProperty({ example: 'After-party' })
  @IsString()
  @Trim()
  @Length(1, 50)
  name: string;

  @ApiProperty({
    example: '1 week before',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @TrimAndNullifyEmpty()
  @IsString()
  @Length(1, 50)
  timeline?: string | null;

  @ApiProperty({
    example: 'flowers',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @TrimAndNullifyEmpty()
  @IsString()
  @Length(1, 50)
  icon?: string | null;
}
