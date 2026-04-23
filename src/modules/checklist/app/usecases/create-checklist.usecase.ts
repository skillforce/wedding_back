import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ChecklistRepository } from '../../infra/checklist.repository';

export class CreateChecklistCommand {
  constructor(public readonly userId: number) {}
}

@CommandHandler(CreateChecklistCommand)
export class CreateChecklistUseCase implements ICommandHandler<
  CreateChecklistCommand,
  string
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistRepository: ChecklistRepository,
  ) {}

  async execute({ userId }: CreateChecklistCommand): Promise<string> {
    const existingChecklist =
      await this.checklistRepository.findByUserId(userId);
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

      return newChecklist.id;
    });
  }
}
