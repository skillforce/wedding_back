import { ApiProperty } from '@nestjs/swagger';
import { Scenario } from '../../domain/entities/scenario.entity';
import { ScenarioPointViewDto } from './scenario-point.view-dto';

export class ScenarioViewDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  id: string;

  @ApiProperty({ type: [ScenarioPointViewDto] })
  points: ScenarioPointViewDto[];

  static mapToViewDto(scenario: Scenario): ScenarioViewDto {
    const dto = new ScenarioViewDto();
    dto.id = scenario.id;
    dto.points = (scenario.points ?? []).map(ScenarioPointViewDto.mapToViewDto);
    return dto;
  }
}