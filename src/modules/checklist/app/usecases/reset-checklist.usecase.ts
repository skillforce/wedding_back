import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ChecklistRepository } from '../../infra/checklist.repository';
import { ChecklistPhasesRepository } from '../../infra/checklist-phases.repository';
import { ChecklistItemsRepository } from '../../infra/checklist-items.repository';
import {
  buildDefaultChecklistItems,
  buildDefaultChecklistPhases,
  ChecklistLocale,
} from './default-checklist-phases';
import { CacheService } from '../../../../adapters/redis/cache.service';

export class ResetChecklistCommand {
  constructor(
    public readonly userId: number,
    public readonly locale: ChecklistLocale = 'ru',
  ) {}
}

@CommandHandler(ResetChecklistCommand)
export class ResetChecklistUseCase implements ICommandHandler<
  ResetChecklistCommand,
  string
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistRepository: ChecklistRepository,
    private readonly checklistPhasesRepository: ChecklistPhasesRepository,
    private readonly checklistItemsRepository: ChecklistItemsRepository,
    private readonly cache: CacheService,
  ) {}

  async execute({ userId, locale }: ResetChecklistCommand): Promise<string> {
    const checklistId = await this.dataSource.transaction(async (manager) => {
      let checklist = await this.checklistRepository.findByUserIdWithManager(
        manager,
        userId,
      );

      if (!checklist) {
        checklist = await this.checklistRepository.saveWithManager(manager, {
          userId,
        });
      } else {
        checklist = await this.checklistRepository.findByUserIdForUpdateOrFail(
          manager,
          userId,
        );
      }

      await this.checklistPhasesRepository.deleteByChecklistIdWithManager(
        manager,
        checklist.id,
      );
      const phases = await this.checklistPhasesRepository.saveManyWithManager(
        manager,
        buildDefaultChecklistPhases(checklist.id, locale),
      );
      await this.checklistItemsRepository.saveManyWithManager(
        manager,
        buildDefaultChecklistItems(phases, locale),
      );

      return checklist.id;
    });
    await this.cache.evictChecklist(userId);
    return checklistId;
  }
}