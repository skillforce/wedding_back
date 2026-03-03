import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { BudgetCurrency } from '../../domain/entities/budget.entity';

export class UpdateBudgetInputDto {
  @ApiProperty({
    description: 'Budget limit',
    example: 500000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  budgetLimit?: number;

  @ApiProperty({
    description: 'Budget currency',
    enum: BudgetCurrency,
    required: false,
  })
  @IsOptional()
  @IsEnum(BudgetCurrency)
  currency?: BudgetCurrency;
}