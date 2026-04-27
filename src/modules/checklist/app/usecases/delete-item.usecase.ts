import { CacheService } from '../../../../adapters/redis/cache.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { ChecklistItemsRepository } from '../../infra/checklist-items.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class DeleteItemCommand {
  constructor(
    public readonly phaseId: string,
    public readonly itemId: string,
    public readonly userId: number,
  ) {}
}

@CommandHandler(DeleteItemCommand)
export class DeleteItemUseCase
  implements ICommandHandler<DeleteItemCommand, void>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistItemsRepository: ChecklistItemsRepository,
    private readonly cache: CacheService,
  ) {}

  async execute({ phaseId, itemId, userId }: DeleteItemCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const item =
        await this.checklistItemsRepository.findByIdAndPhaseIdForUpdateOrFail(
          manager,
          itemId,
          phaseId,
        );
      this.checkOwnership(item.phase?.checklist?.userId, userId);
      await this.checklistItemsRepository.deleteByIdWithManager(manager, itemId);
    });
    await this.cache.evictChecklist(userId);
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