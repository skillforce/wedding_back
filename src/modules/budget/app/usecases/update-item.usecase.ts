import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BudgetRepository } from '../../infra/budget.repository';
import { BudgetItemsRepository } from '../../infra/budget-items.repository';
import { UpdateBudgetSectionItemInputDto } from '../../api/input-dto/update-budget-section-item-input.dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Budget } from '../../domain/entities/budget.entity';
import { CACHE_INVALIDATOR, CachePrefix } from '../../../../adapters/redis/constants';
import { ICacheInvalidator } from '../../../../adapters/redis/cache-invalidator';
import { CacheKey } from '../../../../adapters/redis/cache-key';

export class UpdateItemCommand {
  constructor(
    public readonly itemId: number,
    public readonly dto: UpdateBudgetSectionItemInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(UpdateItemCommand)
export class UpdateItemUseCase implements ICommandHandler<
  UpdateItemCommand,
  void
> {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly itemsRepository: BudgetItemsRepository,
    @Inject(CACHE_INVALIDATOR) private readonly cacheInvalidator: ICacheInvalidator,
  ) {}

  async execute({ itemId, dto, userId }: UpdateItemCommand): Promise<void> {
    const budget = await this.findBudgetByUserIdOrFail(userId);
    await this.findItemAndCheckOwnership(itemId, budget.id);
    await this.itemsRepository.update(itemId, dto);
    await this.cacheInvalidator.invalidate(CacheKey.userPrefix(CachePrefix.Budget, userId));
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

  private async findItemAndCheckOwnership(
    itemId: number,
    budgetId: number,
  ): Promise<void> {
    const item = await this.itemsRepository.findByIdOrFail(itemId);
    if (item.section!.budgetId !== budgetId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Budget item does not belong to user',
      });
    }
  }
}
