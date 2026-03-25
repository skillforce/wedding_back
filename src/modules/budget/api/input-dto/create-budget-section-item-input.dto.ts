import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateIf,
} from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';
import { BudgetItemPriority } from '../../domain/entities/budget-item.entity';
import { BaseCurrency } from '../../../currency/domain/entities/base-currency.enum';

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
    description: 'Deposit amount',
    example: 10000,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.deposit !== null)
  @IsInt()
  @Min(0)
  deposit?: number | null;

  @ApiProperty({
    description: 'Item priority',
    enum: BudgetItemPriority,
    required: false,
  })
  @IsOptional()
  @IsEnum(BudgetItemPriority)
  priority?: BudgetItemPriority;

  @ApiProperty({
    description: 'Item currency (overrides budget currency)',
    enum: BaseCurrency,
    required: true,
    nullable: false,
  })
  @IsEnum(BaseCurrency)
  currency: BaseCurrency;
}
