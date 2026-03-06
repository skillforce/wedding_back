import { ApiProperty } from '@nestjs/swagger';
import { ChecklistItem } from '../../domain/entities/checklist-item.entity';

export class ChecklistItemCompletionViewDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  id: string;

  @ApiProperty({ example: true })
  completed: boolean;

  static mapToViewDto(item: ChecklistItem): ChecklistItemCompletionViewDto {
    const dto = new ChecklistItemCompletionViewDto();
    dto.id = item.id;
    dto.completed = item.completed;
    return dto;
  }
}
