import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { BudgetRepository } from '../../infra/budget.repository';
import { BudgetSectionsRepository } from '../../infra/budget-sections.repository';
import { CreateSectionInputDto } from '../../api/input-dto/create-section.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CACHE_INVALIDATOR, CachePrefix } from '../../../../adapters/redis/constants';
import { ICacheInvalidator } from '../../../../adapters/redis/cache-invalidator';
import { CacheKey } from '../../../../adapters/redis/cache-key';

export class CreateSectionCommand {
  constructor(
    public readonly dto: CreateSectionInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(CreateSectionCommand)
export class CreateSectionUseCase
  implements ICommandHandler<CreateSectionCommand, number>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly budgetRepository: BudgetRepository,
    private readonly sectionsRepository: BudgetSectionsRepository,
    @Inject(CACHE_INVALIDATOR) private readonly cacheInvalidator: ICacheInvalidator,
  ) {}

  async execute({ dto, userId }: CreateSectionCommand): Promise<number> {
    const sectionId = await this.dataSource.transaction(async (manager) => {
      const budget = await this.budgetRepository.findByUserIdForUpdateOrFail(
        manager,
        userId,
      );
      await this.checkSectionsLimit(budget.id, manager);
      await this.checkNameUnique(budget.id, dto.name, manager);

      const maxSortOrder =
        await this.sectionsRepository.findMaxSortOrderByBudgetId(
          budget.id,
          manager,
        );

      const section = await this.sectionsRepository.saveWithManager(manager, {
        budgetId: budget.id,
        name: dto.name,
        sortOrder: (maxSortOrder ?? -1) + 1,
      });

      return section.id;
    });
    await this.cacheInvalidator.invalidate(CacheKey.userPrefix(CachePrefix.Budget, userId));
    return sectionId;
  }

  private async checkNameUnique(
    budgetId: number,
    name: string,
    manager: EntityManager,
  ): Promise<void> {
    const exists = await this.sectionsRepository.existsByBudgetIdAndName(
      budgetId,
      name,
      manager,
    );
    if (exists) {
      throw new DomainException({
        code: DomainExceptionCode.ValidationError,
        message: 'Section with this name already exists',
        extensions: [
          { field: 'name', message: 'Section with this name already exists' },
        ],
      });
    }
  }

  private async checkSectionsLimit(
    budgetId: number,
    manager: EntityManager,
  ): Promise<void> {
    const count = await this.sectionsRepository.countByBudgetId(
      budgetId,
      manager,
    );
    if (count >= 30) {
      throw new DomainException({
        code: DomainExceptionCode.Conflict,
        message: 'Maximum of 30 sections per budget reached',
      });
    }
  }
}