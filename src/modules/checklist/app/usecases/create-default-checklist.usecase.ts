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

export class CreateDefaultChecklistCommand {
  constructor(
    public readonly userId: number,
    public readonly locale: ChecklistLocale,
  ) {}
}

@CommandHandler(CreateDefaultChecklistCommand)
export class CreateDefaultChecklistUseCase implements ICommandHandler<
  CreateDefaultChecklistCommand,
  string
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistRepository: ChecklistRepository,
    private readonly checklistPhasesRepository: ChecklistPhasesRepository,
    private readonly checklistItemsRepository: ChecklistItemsRepository,
    private readonly cache: CacheService,
  ) {}

  async execute({
    userId,
    locale,
  }: CreateDefaultChecklistCommand): Promise<string> {
    const existingChecklist =
      await this.checklistRepository.findByUserId(userId);
    if (existingChecklist) {
      const phasesCount =
        await this.checklistPhasesRepository.countByChecklistId(
          existingChecklist.id,
        );
      if (phasesCount > 0) {
        return existingChecklist.id;
      }
    }

    let seeded = false;
    const checklistId = await this.dataSource.transaction(async (manager) => {
      let checklist = await this.checklistRepository.findByUserIdWithManager(
        manager,
        userId,
      );
      if (!checklist) {
        checklist = await this.checklistRepository.saveWithManager(manager, {
          userId,
        });
      }

      const phasesCount =
        await this.checklistPhasesRepository.countByChecklistId(
          checklist.id,
          manager,
        );
      if (phasesCount > 0) {
        return checklist.id;
      }

      const phases = await this.checklistPhasesRepository.saveManyWithManager(
        manager,
        buildDefaultChecklistPhases(checklist.id, locale),
      );
      await this.checklistItemsRepository.saveManyWithManager(
        manager,
        buildDefaultChecklistItems(phases, locale),
      );
      seeded = true;
      return checklist.id;
    });

    if (seeded) {
      await this.cache.evictChecklist(userId);
    }
    return checklistId;
  }
}