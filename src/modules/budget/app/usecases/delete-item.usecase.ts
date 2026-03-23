import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { BudgetItemsRepository } from '../../infra/budget-items.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

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
