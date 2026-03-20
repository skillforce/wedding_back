import { ApiProperty } from '@nestjs/swagger';
import { BudgetItem } from '../../domain/entities/budget-item.entity';

export class BudgetItemViewDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ведущий' })
  name: string;

  @ApiProperty({ example: 50000 })
  estimatedCost: number;

  @ApiProperty({ example: null, nullable: true })
  actualCost: number | null;

  @ApiProperty({ example: null, nullable: true })
  deposit: number | null;

  @ApiProperty({ example: 'must' })
  priority: string;

  @ApiProperty({ example: false })
  paid: boolean;

  static mapToViewDto(item: BudgetItem): BudgetItemViewDto {
    const dto = new BudgetItemViewDto();
    dto.id = item.id;
    dto.name = item.name;
    dto.estimatedCost = Number(item.estimatedCost);
    dto.actualCost = item.actualCost !== null ? Number(item.actualCost) : null;
    dto.deposit = item.deposit !== null ? Number(item.deposit) : null;
    dto.priority = item.priority;
    dto.paid = item.paid;
    return dto;
  }
}