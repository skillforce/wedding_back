import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { UpdatePhaseInputDto } from '../../api/input-dto/update-phase.input-dto';
import { ChecklistPhasesRepository } from '../../infra/checklist-phases.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CacheService } from '../../../../adapters/redis/cache.service';

export class UpdatePhaseCommand {
  constructor(
    public readonly phaseId: string,
    public readonly dto: UpdatePhaseInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(UpdatePhaseCommand)
export class UpdatePhaseUseCase implements ICommandHandler<
  UpdatePhaseCommand,
  void
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistPhasesRepository: ChecklistPhasesRepository,
    private readonly cache: CacheService,
  ) {}

  async execute({ phaseId, dto, userId }: UpdatePhaseCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const phase =
        await this.checklistPhasesRepository.findByIdForUpdateOrFail(
          manager,
          phaseId,
        );

      this.checkOwnership(phase.checklist?.userId, userId);

      if (dto.name !== undefined) {
        phase.name = dto.name;
      }
      if (dto.timeline !== undefined) {
        phase.timeline = dto.timeline;
      }
      if (dto.icon !== undefined) {
        phase.icon = dto.icon;
      }

      await this.checklistPhasesRepository.saveEntityWithManager(
        manager,
        phase,
      );
    });
    await this.cache.evictChecklist(userId);
  }

  private checkOwnership(
    ownerUserId: number | undefined,
    userId: number,
  ): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Checklist phase does not belong to user',
      });
    }
  }
}