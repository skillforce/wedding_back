import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BudgetRepository } from '../../infra/budget.repository';
import { BudgetItemsRepository } from '../../infra/budget-items.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Budget } from '../../domain/entities/budget.entity';

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
    private readonly budgetRepository: BudgetRepository,
    private readonly itemsRepository: BudgetItemsRepository,
  ) {}

  async execute({ itemId, userId }: DeleteItemCommand): Promise<void> {
    const budget = await this.findBudgetByUserIdOrFail(userId);
    await this.findItemAndCheckOwnership(itemId, budget.id);
    await this.itemsRepository.deleteByIdOrFail(itemId);
  }

  private async findBudgetByUserIdOrFail(userId: number): Promise<Budget> {
    const budget = await this.budgetRepository.findByUserId(userId);
    if (!budget) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget not found',
      });
    }
    return budget;
  }

  private async findItemAndCheckOwnership(itemId: number, budgetId: number): Promise<void> {
    const item = await this.itemsRepository.findByIdOrFail(itemId);
    if (item.section!.budgetId !== budgetId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Budget item does not belong to user',
      });
    }
  }
}