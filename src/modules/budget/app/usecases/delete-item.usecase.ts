import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BudgetItemsRepository } from '../../infra/budget-items.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CACHE_INVALIDATOR, CachePrefix } from '../../../../adapters/redis/constants';
import { ICacheInvalidator } from '../../../../adapters/redis/cache-invalidator';
import { CacheKey } from '../../../../adapters/redis/cache-key';

export class DeleteItemCommand {
  constructor(
    public readonly itemId: number,
    public readonly userId: number,
  ) {}
}

@CommandHandler(DeleteItemCommand)
export class DeleteItemUseCase
  implements ICommandHandler<DeleteItemCommand, void>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly itemsRepository: BudgetItemsRepository,
    @Inject(CACHE_INVALIDATOR) private readonly cacheInvalidator: ICacheInvalidator,
  ) {}

  async execute({ itemId, userId }: DeleteItemCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const item = await this.itemsRepository.findByIdForUpdateOrFail(
        manager,
        itemId,
      );
      this.checkOwnership(item.section?.budget?.userId, userId);

      const sectionItems = await this.itemsRepository.findBySectionIdForUpdate(
        manager,
        item.sectionId,
      );

      await this.itemsRepository.deleteByIdWithManager(manager, itemId);

      const reorderedItems = sectionItems.filter(
        (existingItem) => existingItem.id !== itemId,
      );
      reorderedItems.forEach((existingItem, index) => {
        existingItem.sortOrder = index;
      });

      if (reorderedItems.length) {
        await this.itemsRepository.saveManyWithManager(manager, reorderedItems);
      }
    });
    await this.cacheInvalidator.invalidate(CacheKey.userPrefix(CachePrefix.Budget, userId));
  }

  private checkOwnership(ownerUserId: number | undefined, userId: number): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Budget item does not belong to user',
      });
    }
  }
}
