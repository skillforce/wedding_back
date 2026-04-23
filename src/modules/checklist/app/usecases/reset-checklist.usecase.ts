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
  ) {}

  async execute({ userId, locale }: ResetChecklistCommand): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
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
  }
}
