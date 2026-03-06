import { ApiProperty } from '@nestjs/swagger';
import { ChecklistItem, ChecklistItemPriority } from '../../domain/entities/checklist-item.entity';

export class ChecklistItemViewDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  id: string;

  @ApiProperty({ example: 'Book DJ' })
  title: string;

  @ApiProperty({ example: 'Check reviews first', nullable: true })
  note: string | null;

  @ApiProperty({ example: 'Call on Monday', nullable: true })
  comment: string | null;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiProperty({ enum: ChecklistItemPriority, example: ChecklistItemPriority.Normal })
  priority: ChecklistItemPriority;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  static mapToViewDto(item: ChecklistItem): ChecklistItemViewDto {
    const dto = new ChecklistItemViewDto();
    dto.id = item.id;
    dto.title = item.title;
    dto.note = item.note;
    dto.comment = item.comment;
    dto.completed = item.completed;
    dto.priority = item.priority;
    dto.sortOrder = item.sortOrder;
    return dto;
  }
}
