import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ChecklistPhasesRepository } from '../../infra/checklist-phases.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CacheService } from '../../../../adapters/redis/cache.service';

export class DeletePhaseCommand {
  constructor(
    public readonly phaseId: string,
    public readonly userId: number,
  ) {}
}

@CommandHandler(DeletePhaseCommand)
export class DeletePhaseUseCase
  implements ICommandHandler<DeletePhaseCommand, void>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistPhasesRepository: ChecklistPhasesRepository,
    private readonly cache: CacheService,
  ) {}

  async execute({ phaseId, userId }: DeletePhaseCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const phase = await this.checklistPhasesRepository.findByIdForUpdateOrFail(
        manager,
        phaseId,
      );
      this.checkOwnership(phase.checklist?.userId, userId);
      const remainingPhases =
        await this.checklistPhasesRepository.findByChecklistIdForUpdate(
          manager,
          phase.checklistId,
        );

      await this.checklistPhasesRepository.deleteByIdWithManager(manager, phaseId);

      const reorderedPhases = remainingPhases.filter(
        (existingPhase) => existingPhase.id !== phaseId,
      );
      reorderedPhases.forEach((existingPhase, index) => {
        existingPhase.sortOrder = index;
      });

      if (reorderedPhases.length) {
        await this.checklistPhasesRepository.saveManyWithManager(
          manager,
          reorderedPhases,
        );
      }
    });
    await this.cache.evictChecklist(userId);
  }

  private checkOwnership(ownerUserId: number | undefined, userId: number): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Checklist phase does not belong to user',
      });
    }
  }
}