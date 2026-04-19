import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ScenarioPointRepository } from '../../infra/scenario-point.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class DeleteScenarioPointCommand {
  constructor(
    public readonly pointId: string,
    public readonly userId: number,
  ) {}
}

@CommandHandler(DeleteScenarioPointCommand)
export class DeleteScenarioPointUseCase
  implements ICommandHandler<DeleteScenarioPointCommand, void>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly scenarioPointRepository: ScenarioPointRepository,
  ) {}

  async execute({ pointId, userId }: DeleteScenarioPointCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const point = await this.scenarioPointRepository.findByIdForUpdateOrFail(
        manager,
        pointId,
      );

      this.checkOwnership(point.scenario?.userId, userId);

      await this.scenarioPointRepository.deleteByIdWithManager(manager, pointId);
    });
  }

  private checkOwnership(ownerUserId: number | undefined, userId: number): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Scenario point does not belong to user',
      });
    }
  }
}