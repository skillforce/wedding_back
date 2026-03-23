import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';
import { BudgetRepository } from '../../infra/budget.repository';
import { BudgetSectionsRepository } from '../../infra/budget-sections.repository';
import { CreateSectionInputDto } from '../../api/input-dto/create-section.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

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
  ) {}

  async execute({ dto, userId }: CreateSectionCommand): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const budget = await this.budgetRepository.findByUserIdForUpdateOrFail(
        manager,
        userId,
      );
      await this.checkSectionsLimit(budget.id, manager);

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
