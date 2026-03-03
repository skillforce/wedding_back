import { ApiProperty } from '@nestjs/swagger';
import { Budget } from '../../domain/entities/budget.entity';
import { BudgetSectionViewDto } from './budget-section.view-dto';

export class BudgetViewDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 500000 })
  budgetLimit: number;

  @ApiProperty({ example: 'RUB' })
  currency: string;

  @ApiProperty({ type: [BudgetSectionViewDto] })
  sections: BudgetSectionViewDto[];

  static mapToViewDto(budget: Budget): BudgetViewDto {
    const dto = new BudgetViewDto();
    dto.id = budget.id;
    dto.budgetLimit = Number(budget.budgetLimit);
    dto.currency = budget.currency;
    dto.sections = (budget.sections ?? []).map(
      BudgetSectionViewDto.mapToViewDto,
    );
    return dto;
  }
}