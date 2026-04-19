import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { CreateScenarioPointInputDto } from '../../api/input-dto/create-scenario-point.input-dto';
import { ScenarioRepository } from '../../infra/scenario.repository';
import { ScenarioPointRepository } from '../../infra/scenario-point.repository';
import { ScenarioPointIcon } from '../../domain/entities/scenario-point.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

const SCENARIO_POINTS_LIMIT = 40;

export class CreateScenarioPointCommand {
  constructor(
    public readonly dto: CreateScenarioPointInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(CreateScenarioPointCommand)
export class CreateScenarioPointUseCase implements ICommandHandler<
  CreateScenarioPointCommand,
  string
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly scenarioRepository: ScenarioRepository,
    private readonly scenarioPointRepository: ScenarioPointRepository,
  ) {}

  async execute({ dto, userId }: CreateScenarioPointCommand): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      const scenario =
        await this.scenarioRepository.findByUserIdForUpdateOrFail(
          manager,
          userId,
        );

      const count = await this.scenarioPointRepository.countByScenarioId(
        scenario.id,
        manager,
      );
      this.assertLimitNotReached(count);

      const existing =
        await this.scenarioPointRepository.findByScenarioIdAndTime(
          scenario.id,
          dto.time,
          manager,
        );
      this.assertTimeNotTaken(existing);

      const point = await this.scenarioPointRepository.saveWithManager(
        manager,
        {
          scenarioId: scenario.id,
          time: dto.time,
          title: dto.title,
          icon: dto.icon ?? ScenarioPointIcon.Ceremony,
          note: dto.note ?? '',
          duration: dto.duration ?? null,
        },
      );

      return point.id;
    });
  }

  private assertLimitNotReached(count: number): void {
    if (count >= SCENARIO_POINTS_LIMIT) {
      throw new DomainException({
        code: DomainExceptionCode.Conflict,
        message: 'errors.scenario.limitReached',
        extensions: [{ field: '', message: 'errors.scenario.limitReached' }],
      });
    }
  }

  private assertTimeNotTaken(existing: unknown): void {
    if (existing) {
      throw new DomainException({
        code: DomainExceptionCode.Conflict,
        message: 'errors.scenario.timeAlreadyExists',
        extensions: [
          { field: 'time', message: 'errors.scenario.timeAlreadyExists' },
        ],
      });
    }
  }
}
