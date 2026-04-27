import { CacheService } from '../../../../adapters/redis/cache.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';
import { MoveBudgetItemInputDto } from '../../api/input-dto/move-budget-item.input-dto';
import { BudgetSectionsRepository } from '../../infra/budget-sections.repository';
import { BudgetItemsRepository } from '../../infra/budget-items.repository';
import { BudgetItem } from '../../domain/entities/budget-item.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

const BUDGET_ITEMS_LIMIT = 20;

export class MoveItemCommand {
  constructor(
    public readonly dto: MoveBudgetItemInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(MoveItemCommand)
export class MoveItemUseCase
  implements ICommandHandler<MoveItemCommand, number[]>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly sectionsRepository: BudgetSectionsRepository,
    private readonly itemsRepository: BudgetItemsRepository,
    private readonly cache: CacheService,
  ) {}

  async execute({ dto, userId }: MoveItemCommand): Promise<number[]> {
    const affectedIds = await this.dataSource.transaction(async (manager) => {
      const item = await this.itemsRepository.findByIdForUpdateOrFail(
        manager,
        dto.itemId,
      );
      this.checkOwnership(item.section?.budget?.userId, userId, 'Budget item');

      const sourceSection = item.section!;
      const targetSection =
        dto.targetSectionId === item.sectionId
          ? sourceSection
          : await this.sectionsRepository.findByIdForUpdateOrFail(
              manager,
              dto.targetSectionId,
            );
      if (targetSection.id !== sourceSection.id) {
        this.checkOwnership(
          targetSection.budget?.userId,
          userId,
          'Budget section',
        );
      }

      const sourceItems = await this.itemsRepository.findBySectionIdForUpdate(
        manager,
        sourceSection.id,
      );
      const movingItem = this.findMovingItemOrFail(sourceItems, dto.itemId);

      if (sourceSection.id === targetSection.id) {
        await this.reorderItemsWithinSection(
          manager,
          sourceItems,
          movingItem,
          dto.targetIndex,
        );
        return [sourceSection.id];
      }

      const targetItems = await this.itemsRepository.findBySectionIdForUpdate(
        manager,
        targetSection.id,
      );
      if (targetItems.length >= BUDGET_ITEMS_LIMIT) {
        throw new DomainException({
          code: DomainExceptionCode.ValidationError,
          message: 'Maximum of 20 items per section reached',
          extensions: [
            {
              field: 'targetSectionId',
              message: 'Maximum of 20 items per section reached',
            },
          ],
        });
      }

      this.validateTargetIndex(dto.targetIndex, targetItems.length);

      const sourceItemsWithoutMoved = sourceItems.filter(
        (sourceItem) => sourceItem.id !== dto.itemId,
      );
      const targetItemsWithMoved = this.insertItemAtIndex(
        targetItems,
        dto.targetIndex,
        this.cloneItem(movingItem, { sectionId: targetSection.id }),
      );
      const reIndexedSourceItems = this.reindexItems(sourceItemsWithoutMoved);
      const reIndexedTargetItems = this.reindexItems(targetItemsWithMoved);

      if (reIndexedSourceItems.length) {
        await this.itemsRepository.saveManyWithManager(
          manager,
          reIndexedSourceItems,
        );
      }
      await this.itemsRepository.saveManyWithManager(
        manager,
        reIndexedTargetItems,
      );

      return [sourceSection.id, targetSection.id];
    });
    await this.cache.evictBudget(userId);
    return affectedIds;
  }

  private validateTargetIndex(targetIndex: number, itemsLength: number): void {
    if (targetIndex < 0 || targetIndex > itemsLength) {
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'targetIndex is out of bounds',
        extensions: [
          {
            field: 'targetIndex',
            message: 'targetIndex is out of bounds',
          },
        ],
      });
    }
  }

  private reindexItems(items: BudgetItem[]): BudgetItem[] {
    return items.map((item, index) =>
      this.cloneItem(item, {
        sortOrder: index,
      }),
    );
  }

  private findMovingItemOrFail(
    sourceItems: BudgetItem[],
    itemId: number,
  ): BudgetItem {
    const movingItem = sourceItems.find((sourceItem) => sourceItem.id === itemId);
    if (!movingItem) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget item not found',
      });
    }

    return movingItem;
  }

  private async reorderItemsWithinSection(
    manager: EntityManager,
    sourceItems: BudgetItem[],
    movingItem: BudgetItem,
    targetIndex: number,
  ): Promise<void> {
    const itemsWithoutMoving = sourceItems.filter(
      (sourceItem) => sourceItem.id !== movingItem.id,
    );
    this.validateTargetIndex(targetIndex, itemsWithoutMoving.length);

    const reorderedItems = this.reindexItems(
      this.insertItemAtIndex(itemsWithoutMoving, targetIndex, movingItem),
    );

    if (reorderedItems.length) {
      await this.itemsRepository.saveManyWithManager(manager, reorderedItems);
    }
  }

  private insertItemAtIndex(
    items: BudgetItem[],
    targetIndex: number,
    item: BudgetItem,
  ): BudgetItem[] {
    return [...items.slice(0, targetIndex), item, ...items.slice(targetIndex)];
  }

  private cloneItem(
    item: BudgetItem,
    overrides: Partial<BudgetItem> = {},
  ): BudgetItem {
    return Object.assign(new BudgetItem(), item, overrides);
  }

  private checkOwnership(
    ownerUserId: number | undefined,
    userId: number,
    entityName: string,
  ): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `${entityName} does not belong to user`,
      });
    }
  }
}
