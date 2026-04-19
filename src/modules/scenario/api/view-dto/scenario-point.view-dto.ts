import { ApiProperty } from '@nestjs/swagger';
import { ScenarioPoint } from '../../domain/entities/scenario-point.entity';

export class ScenarioPointViewDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  id: string;

  @ApiProperty({ example: '14:30' })
  time: string;

  @ApiProperty({ example: 'Ceremony' })
  title: string;

  @ApiProperty({ example: 'ceremony' })
  icon: string;

  @ApiProperty({ example: '' })
  note: string;

  @ApiProperty({ example: 30, nullable: true, description: 'Duration in minutes' })
  duration: number | null;

  static mapToViewDto(point: ScenarioPoint): ScenarioPointViewDto {
    const dto = new ScenarioPointViewDto();
    dto.id = point.id;
    dto.time = point.time;
    dto.title = point.title;
    dto.icon = point.icon;
    dto.note = point.note;
    dto.duration = point.duration;
    return dto;
  }
}