import { ApiProperty } from '@nestjs/swagger';
import { BudgetSection } from '../../domain/entities/budget-section.entity';
import { BudgetItemViewDto } from './budget-item.view-dto';

export class BudgetSectionViewDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Организация' })
  name: string;

  @ApiProperty({ type: [BudgetItemViewDto] })
  items: BudgetItemViewDto[];

  static mapToViewDto(section: BudgetSection): BudgetSectionViewDto {
    const dto = new BudgetSectionViewDto();
    dto.id = section.id;
    dto.name = section.name;
    dto.items = (section.items ?? []).map(BudgetItemViewDto.mapToViewDto);
    return dto;
  }
}