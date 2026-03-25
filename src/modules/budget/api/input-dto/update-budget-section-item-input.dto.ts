import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
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

export class UpdateBudgetSectionItemInputDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Ведущий',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Trim()
  @Length(1, 50)
  name?: string;

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
    description: 'Actual cost (send null to clear)',
    example: 45000,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.actualCost !== null)
  @IsInt()
  @Min(0)
  actualCost?: number | null;

  @ApiProperty({
    description: 'Deposit amount (send null to clear)',
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
    description: 'Whether the item is paid',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @ApiProperty({
    description: 'Item currency',
    enum: BaseCurrency,
    required: false,
  })
  @IsOptional()
  @IsEnum(BaseCurrency)
  currency?: BaseCurrency;
}
