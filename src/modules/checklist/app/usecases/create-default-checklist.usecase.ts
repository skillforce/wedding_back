import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ChecklistRepository } from '../../infra/checklist.repository';
import { ChecklistPhasesRepository } from '../../infra/checklist-phases.repository';
import { buildDefaultChecklistPhases, ChecklistLocale } from './default-checklist-phases';

export class CreateDefaultChecklistCommand {
  constructor(
    public readonly userId: number,
    public readonly locale: ChecklistLocale = 'ru',
  ) {}
}

@CommandHandler(CreateDefaultChecklistCommand)
export class CreateDefaultChecklistUseCase
  implements ICommandHandler<CreateDefaultChecklistCommand, string>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistRepository: ChecklistRepository,
    private readonly checklistPhasesRepository: ChecklistPhasesRepository,
  ) {}

  async execute({ userId, locale }: CreateDefaultChecklistCommand): Promise<string> {
    const existingChecklist = await this.checklistRepository.findByUserId(userId);
    if (existingChecklist) {
      return existingChecklist.id;
    }

    return this.dataSource.transaction(async (manager) => {
      const checklist = await this.checklistRepository.findByUserIdWithManager(
        manager,
        userId,
      );
      if (checklist) {
        return checklist.id;
      }

      const newChecklist = await this.checklistRepository.saveWithManager(
        manager,
        { userId },
      );
      await this.checklistPhasesRepository.saveManyWithManager(
        manager,
        buildDefaultChecklistPhases(newChecklist.id, locale),
      );

      return newChecklist.id;
    });
  }
}
