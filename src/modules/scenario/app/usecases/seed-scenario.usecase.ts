import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ScenarioRepository } from '../../infra/scenario.repository';
import { ScenarioPointRepository } from '../../infra/scenario-point.repository';
import { buildDefaultScenarioPoints, ScenarioLocale } from './default-scenario-points';

export class SeedScenarioCommand {
  constructor(
    public readonly userId: number,
    public readonly locale: ScenarioLocale = 'ru',
  ) {}
}

@CommandHandler(SeedScenarioCommand)
export class SeedScenarioUseCase implements ICommandHandler<SeedScenarioCommand, void> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly scenarioRepository: ScenarioRepository,
    private readonly scenarioPointRepository: ScenarioPointRepository,
  ) {}

  async execute({ userId, locale }: SeedScenarioCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      let scenario = await this.scenarioRepository.findByUserIdWithManager(manager, userId);
      if (!scenario) {
        scenario = await this.scenarioRepository.saveWithManager(manager, { userId });
      }

      await this.scenarioPointRepository.deleteByScenarioIdWithManager(manager, scenario.id);
      await this.scenarioPointRepository.saveManyWithManager(
        manager,
        buildDefaultScenarioPoints(scenario.id, locale),
      );
    });
  }
}