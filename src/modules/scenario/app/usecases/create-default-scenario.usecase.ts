import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ScenarioRepository } from '../../infra/scenario.repository';

export class CreateDefaultScenarioCommand {
  constructor(public readonly userId: number) {}
}

@CommandHandler(CreateDefaultScenarioCommand)
export class CreateDefaultScenarioUseCase
  implements ICommandHandler<CreateDefaultScenarioCommand, string>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly scenarioRepository: ScenarioRepository,
  ) {}

  async execute({ userId }: CreateDefaultScenarioCommand): Promise<string> {
    const existing = await this.scenarioRepository.findByUserId(userId);
    if (existing) {
      return existing.id;
    }

    return this.dataSource.transaction(async (manager) => {
      const inTx = await this.scenarioRepository.findByUserIdWithManager(manager, userId);
      if (inTx) {
        return inTx.id;
      }

      const scenario = await this.scenarioRepository.saveWithManager(manager, { userId });
      return scenario.id;
    });
  }
}