import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';
import { MoveItemInputDto } from '../../api/input-dto/move-item.input-dto';
import { ChecklistPhasesRepository } from '../../infra/checklist-phases.repository';
import { ChecklistItemsRepository } from '../../infra/checklist-items.repository';
import { ChecklistItem } from '../../domain/entities/checklist-item.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

const CHECKLIST_ITEMS_LIMIT = 10;

export class MoveItemCommand {
  constructor(
    public readonly dto: MoveItemInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(MoveItemCommand)
export class MoveItemUseCase implements ICommandHandler<MoveItemCommand, void> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly checklistPhasesRepository: ChecklistPhasesRepository,
    private readonly checklistItemsRepository: ChecklistItemsRepository,
  ) {}

  async execute({ dto, userId }: MoveItemCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const item = await this.checklistItemsRepository.findByIdForUpdateOrFail(
        manager,
        dto.itemId,
      );
      this.checkOwnership(
        item.phase?.checklist?.userId,
        userId,
        'Checklist item',
      );

      const sourcePhase =
        await this.checklistPhasesRepository.findByIdForUpdateOrFail(
          manager,
          item.phaseId,
        );

      const targetPhase =
        dto.targetPhaseId === item.phaseId
          ? sourcePhase
          : await this.checklistPhasesRepository.findByIdForUpdateOrFail(
              manager,
              dto.targetPhaseId,
            );
      this.checkOwnership(
        targetPhase.checklist?.userId,
        userId,
        'Checklist phase',
      );

      const sourceItems =
        await this.checklistItemsRepository.findByPhaseIdForUpdate(
          manager,
          sourcePhase.id,
        );
      const movingItem = this.findMovingItemOrFail(sourceItems, dto.itemId);

      if (sourcePhase.id === targetPhase.id) {
        await this.reorderItemsWithinPhase(
          manager,
          sourceItems,
          movingItem,
          dto.targetIndex,
        );
        return;
      }

      const targetItems =
        await this.checklistItemsRepository.findByPhaseIdForUpdate(
          manager,
          targetPhase.id,
        );
      if (targetItems.length >= CHECKLIST_ITEMS_LIMIT) {
        throw new DomainException({
          code: DomainExceptionCode.ValidationError,
          message: 'Maximum of 10 items per phase reached',
          extensions: [
            {
              field: 'targetPhaseId',
              message: 'Maximum of 10 items per phase reached',
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
        this.cloneItem(movingItem, { phaseId: targetPhase.id }),
      );
      const reIndexedSourceItems = this.reindexItems(sourceItemsWithoutMoved);
      const reIndexedTargetItems = this.reindexItems(targetItemsWithMoved);

      if (reIndexedSourceItems.length) {
        await this.checklistItemsRepository.saveManyWithManager(
          manager,
          reIndexedSourceItems,
        );
      }
      await this.checklistItemsRepository.saveManyWithManager(
        manager,
        reIndexedTargetItems,
      );
    });
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

  private reindexItems(items: ChecklistItem[]): ChecklistItem[] {
    return items.map((item, index) =>
      this.cloneItem(item, {
        sortOrder: index,
      }),
    );
  }

  private findMovingItemOrFail(
    sourceItems: ChecklistItem[],
    itemId: string,
  ): ChecklistItem {
    const movingItem = sourceItems.find(
      (sourceItem) => sourceItem.id === itemId,
    );
    if (!movingItem) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Checklist item not found',
      });
    }

    return movingItem;
  }

  private async reorderItemsWithinPhase(
    manager: EntityManager,
    sourceItems: ChecklistItem[],
    movingItem: ChecklistItem,
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
      await this.checklistItemsRepository.saveManyWithManager(
        manager,
        reorderedItems,
      );
    }
  }

  private insertItemAtIndex(
    items: ChecklistItem[],
    targetIndex: number,
    item: ChecklistItem,
  ): ChecklistItem[] {
    return [...items.slice(0, targetIndex), item, ...items.slice(targetIndex)];
  }

  private cloneItem(
    item: ChecklistItem,
    overrides: Partial<ChecklistItem> = {},
  ): ChecklistItem {
    return Object.assign(new ChecklistItem(), item, overrides);
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
