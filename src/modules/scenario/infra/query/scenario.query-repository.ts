import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scenario } from '../../domain/entities/scenario.entity';
import { ScenarioPoint } from '../../domain/entities/scenario-point.entity';
import { ScenarioViewDto } from '../../api/view-dto/scenario.view-dto';
import { ScenarioPointViewDto } from '../../api/view-dto/scenario-point.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class ScenarioQueryRepository {
  constructor(
    @InjectRepository(Scenario)
    private readonly scenarioOrmRepository: Repository<Scenario>,
    @InjectRepository(ScenarioPoint)
    private readonly pointOrmRepository: Repository<ScenarioPoint>,
  ) {}

  async findScenarioByUserId(userId: number): Promise<ScenarioViewDto | null> {
    const scenario = await this.scenarioOrmRepository.findOne({
      where: { userId },
      relations: { points: true },
      order: { points: { time: 'ASC' } },
    });
    return scenario ? ScenarioViewDto.mapToViewDto(scenario) : null;
  }

  async findScenarioByUserIdOrFail(userId: number): Promise<ScenarioViewDto> {
    const scenario = await this.findScenarioByUserId(userId);
    if (!scenario) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Scenario not found',
      });
    }
    return scenario;
  }

  async findPointByIdOrFail(id: string): Promise<ScenarioPointViewDto> {
    const point = await this.pointOrmRepository.findOneBy({ id });
    if (!point) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Scenario point not found',
      });
    }
    return ScenarioPointViewDto.mapToViewDto(point);
  }

  async findSortedPointsByUserId(
    userId: number,
  ): Promise<ScenarioPointViewDto[]> {
    const scenario = await this.scenarioOrmRepository.findOne({
      where: { userId },
      relations: { points: true },
      order: { points: { time: 'ASC' } },
    });
    return (scenario?.points ?? []).map(ScenarioPointViewDto.mapToViewDto);
  }
}
