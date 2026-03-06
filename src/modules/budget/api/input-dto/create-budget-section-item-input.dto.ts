import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';
import { BudgetItemPriority } from '../../domain/entities/budget-item.entity';

export class CreateBudgetSectionItemInputDto {
  @ApiProperty({ description: 'Section ID the item belongs to', example: 1 })
  @IsInt()
  sectionId: number;

  @ApiProperty({ description: 'Item name', example: 'Ведущий' })
  @IsString()
  @Trim()
  @Length(1, 50)
  name: string;

  @ApiProperty({
    description: 'Estimated cost',
    example: 50000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedCost?: number;

  @ApiProperty({
    description: 'Item priority',
    enum: BudgetItemPriority,
    required: false,
  })
  @IsOptional()
  @IsEnum(BudgetItemPriority)
  priority?: BudgetItemPriority;
}
