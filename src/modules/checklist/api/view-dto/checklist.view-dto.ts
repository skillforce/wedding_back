import { ApiProperty } from '@nestjs/swagger';
import { Checklist } from '../../domain/entities/checklist.entity';
import { ChecklistPhaseViewDto } from './checklist-phase.view-dto';

export class ChecklistViewDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  id: string;

  @ApiProperty({ type: [ChecklistPhaseViewDto] })
  phases: ChecklistPhaseViewDto[];

  static mapToViewDto(checklist: Checklist): ChecklistViewDto {
    const dto = new ChecklistViewDto();
    dto.id = checklist.id;
    dto.phases = (checklist.phases ?? []).map(ChecklistPhaseViewDto.mapToViewDto);
    return dto;
  }
}
