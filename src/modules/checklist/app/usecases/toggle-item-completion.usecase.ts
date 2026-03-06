import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ChecklistItemsRepository } from '../../infra/checklist-items.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class ToggleItemCompletionCommand {
  constructor(
    public readonly phaseId: string,
    public readonly itemId: string,
    public readonly userId: number,
  ) {}
}

@CommandHandler(ToggleItemCompletionCommand)
export class ToggleItemCompletionUseCase
  implements ICommandHandler<ToggleItemCompletionCommand, void>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistItemsRepository: ChecklistItemsRepository,
  ) {}

  async execute({
    phaseId,
    itemId,
    userId,
  }: ToggleItemCompletionCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const item =
        await this.checklistItemsRepository.findByIdAndPhaseIdForUpdateOrFail(
          manager,
          itemId,
          phaseId,
        );
      this.checkOwnership(item.phase?.checklist?.userId, userId);

      item.completed = !item.completed;
      await this.checklistItemsRepository.saveEntityWithManager(manager, item);
    });
  }

  private checkOwnership(ownerUserId: number | undefined, userId: number): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Checklist item does not belong to user',
      });
    }
  }
}
