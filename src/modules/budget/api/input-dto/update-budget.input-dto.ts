import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { BaseCurrency } from '../../../currency/domain/entities/base-currency.enum';

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
    enum: BaseCurrency,
    required: false,
  })
  @IsOptional()
  @IsEnum(BaseCurrency)
  currency?: BaseCurrency;
}