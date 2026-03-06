import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';
import { TrimAndNullifyEmpty } from '../../../../core/decorators/transform/trim-and-nullify-empty';
import { ChecklistItemPriority } from '../../domain/entities/checklist-item.entity';

export class UpdateChecklistPhaseItemInputDto {
  @ApiProperty({
    example: 'Updated title',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Trim()
  @Length(1, 50)
  title?: string;

  @ApiProperty({
    example: 'Updated note',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @TrimAndNullifyEmpty()
  @IsString()
  @Length(1, 50)
  note?: string | null;

  @ApiProperty({
    example: 'Do not forget to call vendor',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @TrimAndNullifyEmpty()
  @IsString()
  @Length(1, 200)
  comment?: string | null;

  @ApiProperty({
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiProperty({
    enum: ChecklistItemPriority,
    required: false,
    example: ChecklistItemPriority.High,
  })
  @IsOptional()
  @IsEnum(ChecklistItemPriority)
  priority?: ChecklistItemPriority;
}
