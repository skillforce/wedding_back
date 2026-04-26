import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BudgetSectionsRepository } from '../../infra/budget-sections.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CACHE_INVALIDATOR, CachePrefix } from '../../../../adapters/redis/constants';
import { ICacheInvalidator } from '../../../../adapters/redis/cache-invalidator';
import { CacheKey } from '../../../../adapters/redis/cache-key';

export class DeleteSectionCommand {
  constructor(
    public readonly sectionId: number,
    public readonly userId: number,
  ) {}
}

@CommandHandler(DeleteSectionCommand)
export class DeleteSectionUseCase
  implements ICommandHandler<DeleteSectionCommand, void>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly sectionsRepository: BudgetSectionsRepository,
    @Inject(CACHE_INVALIDATOR) private readonly cacheInvalidator: ICacheInvalidator,
  ) {}

  async execute({ sectionId, userId }: DeleteSectionCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const section = await this.sectionsRepository.findByIdForUpdateOrFail(
        manager,
        sectionId,
      );
      this.checkOwnership(section.budget?.userId, userId);

      const remainingSections =
        await this.sectionsRepository.findByBudgetIdForUpdate(
          manager,
          section.budgetId,
        );

      await this.sectionsRepository.deleteByIdWithManager(manager, sectionId);

      const reorderedSections = remainingSections.filter(
        (existingSection) => existingSection.id !== sectionId,
      );
      reorderedSections.forEach((existingSection, index) => {
        existingSection.sortOrder = index;
      });

      if (reorderedSections.length) {
        await this.sectionsRepository.saveManyWithManager(
          manager,
          reorderedSections,
        );
      }
    });
    await this.cacheInvalidator.invalidate(CacheKey.userPrefix(CachePrefix.Budget, userId));
  }

  private checkOwnership(ownerUserId: number | undefined, userId: number): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Budget section does not belong to user',
      });
    }
  }
}
