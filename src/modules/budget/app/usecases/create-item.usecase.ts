import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { BudgetRepository } from '../../infra/budget.repository';
import { BudgetSectionsRepository } from '../../infra/budget-sections.repository';
import { BudgetItemsRepository } from '../../infra/budget-items.repository';
import { CreateBudgetSectionItemInputDto } from '../../api/input-dto/create-budget-section-item-input.dto';
import { BudgetItemPriority } from '../../domain/entities/budget-item.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CACHE_INVALIDATOR, CachePrefix } from '../../../../adapters/redis/constants';
import { ICacheInvalidator } from '../../../../adapters/redis/cache-invalidator';
import { CacheKey } from '../../../../adapters/redis/cache-key';

export class CreateItemCommand {
  constructor(
    public readonly dto: CreateBudgetSectionItemInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(CreateItemCommand)
export class CreateItemUseCase implements ICommandHandler<
  CreateItemCommand,
  number
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly budgetRepository: BudgetRepository,
    private readonly sectionsRepository: BudgetSectionsRepository,
    private readonly itemsRepository: BudgetItemsRepository,
    @Inject(CACHE_INVALIDATOR) private readonly cacheInvalidator: ICacheInvalidator,
  ) {}

  async execute({ dto, userId }: CreateItemCommand): Promise<number> {
    const itemId = await this.dataSource.transaction(async (manager) => {
      const budget = await this.budgetRepository.findByUserIdForUpdateOrFail(
        manager,
        userId,
      );
      const section = await this.sectionsRepository.findByIdForUpdateOrFail(
        manager,
        dto.sectionId,
      );
      this.checkSectionOwnership(section.budgetId, budget.id);
      await this.checkItemsLimit(section.id, manager);

      const maxSortOrder =
        await this.itemsRepository.findMaxSortOrderBySectionId(
          section.id,
          manager,
        );

      const item = await this.itemsRepository.saveWithManager(manager, {
        sectionId: section.id,
        name: dto.name,
        estimatedCost: dto.estimatedCost ?? 0,
        actualCost: null,
        priority: dto.priority ?? BudgetItemPriority.MUST,
        paid: false,
        deposit: dto.deposit ?? null,
        currency: dto.currency,
        sortOrder: (maxSortOrder ?? -1) + 1,
      });

      return item.id;
    });
    await this.cacheInvalidator.invalidate(CacheKey.userPrefix(CachePrefix.Budget, userId));
    return itemId;
  }

  private checkSectionOwnership(
    sectionBudgetId: number,
    budgetId: number,
  ): void {
    if (sectionBudgetId !== budgetId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Budget section does not belong to user',
      });
    }
  }

  private async checkItemsLimit(
    sectionId: number,
    manager: EntityManager,
  ): Promise<void> {
    const count = await this.itemsRepository.countBySectionId(
      sectionId,
      manager,
    );
    if (count >= 20) {
      throw new DomainException({
        code: DomainExceptionCode.Conflict,
        message: 'Maximum of 20 items per section reached',
      });
    }
  }
}
