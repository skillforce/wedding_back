import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';
import { TrimAndNullifyEmpty } from '../../../../core/decorators/transform/trim-and-nullify-empty';
import { ChecklistItemPriority } from '../../domain/entities/checklist-item.entity';

export class CreateItemInputDto {
  @ApiProperty({ example: 'Book DJ' })
  @IsString()
  @Trim()
  @Length(1, 50)
  title: string;

  @ApiProperty({
    example: 'Check reviews first',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @TrimAndNullifyEmpty()
  @IsString()
  @Length(1, 50)
  note?: string | null;

  @ApiProperty({
    enum: ChecklistItemPriority,
    required: false,
    example: ChecklistItemPriority.Normal,
  })
  @IsOptional()
  @IsEnum(ChecklistItemPriority)
  priority?: ChecklistItemPriority;
}
