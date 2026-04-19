import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { UpdateScenarioPointInputDto } from '../../api/input-dto/update-scenario-point.input-dto';
import { ScenarioPointRepository } from '../../infra/scenario-point.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class UpdateScenarioPointCommand {
  constructor(
    public readonly pointId: string,
    public readonly dto: UpdateScenarioPointInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(UpdateScenarioPointCommand)
export class UpdateScenarioPointUseCase implements ICommandHandler<
  UpdateScenarioPointCommand,
  void
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly scenarioPointRepository: ScenarioPointRepository,
  ) {}

  async execute({
    pointId,
    dto,
    userId,
  }: UpdateScenarioPointCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const point = await this.scenarioPointRepository.findByIdForUpdateOrFail(
        manager,
        pointId,
      );

      this.checkOwnership(point.scenario?.userId, userId);

      if (dto.time !== undefined && dto.time !== point.time) {
        const existing =
          await this.scenarioPointRepository.findByScenarioIdAndTime(
            point.scenarioId,
            dto.time,
            manager,
          );
        if (existing) {
          throw new DomainException({
            code: DomainExceptionCode.Conflict,
            message: 'errors.scenario.timeAlreadyExists',
            extensions: [
              { field: 'time', message: 'errors.scenario.timeAlreadyExists' },
            ],
          });
        }
        point.time = dto.time;
      }

      if (dto.title !== undefined) {
        point.title = dto.title;
      }
      if (dto.icon !== undefined) {
        point.icon = dto.icon;
      }
      if (dto.note !== undefined) {
        point.note = dto.note ?? '';
      }
      if (dto.duration !== undefined) {
        point.duration = dto.duration ?? null;
      }

      await this.scenarioPointRepository.saveEntityWithManager(manager, point);
    });
  }

  private checkOwnership(
    ownerUserId: number | undefined,
    userId: number,
  ): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Scenario point does not belong to user',
      });
    }
  }
}
