import { ApiProperty } from '@nestjs/swagger';
import { ChecklistPhase } from '../../domain/entities/checklist-phase.entity';
import { ChecklistItemViewDto } from './checklist-item.view-dto';

export class ChecklistPhaseViewDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  id: string;

  @ApiProperty({ example: 'After-party', nullable: true })
  name: string | null;

  @ApiProperty({ example: '12–10 months before', nullable: true })
  timeline: string | null;

  @ApiProperty({ example: 'flowers', nullable: true })
  icon: string | null;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ type: [ChecklistItemViewDto] })
  items: ChecklistItemViewDto[];

  static mapToViewDto(phase: ChecklistPhase): ChecklistPhaseViewDto {
    const dto = new ChecklistPhaseViewDto();
    dto.id = phase.id;
    dto.name = phase.name;
    dto.timeline = phase.timeline;
    dto.icon = phase.icon;
    dto.sortOrder = phase.sortOrder;
    dto.items = (phase.items ?? []).map(ChecklistItemViewDto.mapToViewDto);
    return dto;
  }
}
