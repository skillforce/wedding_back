import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BudgetRepository } from '../../infra/budget.repository';
import { BudgetSectionsRepository } from '../../infra/budget-sections.repository';
import { BudgetItemsRepository } from '../../infra/budget-items.repository';
import { CreateBudgetSectionItemInputDto } from '../../api/input-dto/create-budget-section-item-input.dto';
import { BudgetItemPriority } from '../../domain/entities/budget-item.entity';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Budget } from '../../domain/entities/budget.entity';

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
    private readonly budgetRepository: BudgetRepository,
    private readonly sectionsRepository: BudgetSectionsRepository,
    private readonly itemsRepository: BudgetItemsRepository,
  ) {}

  async execute({ dto, userId }: CreateItemCommand): Promise<number> {
    const budget = await this.findBudgetByUserIdOrFail(userId);
    await this.findSectionAndCheckOwnership(dto.sectionId, budget.id);
    await this.checkItemsLimit(dto.sectionId);

    const item = await this.itemsRepository.save({
      sectionId: dto.sectionId,
      name: dto.name,
      estimatedCost: dto.estimatedCost ?? 0,
      actualCost: null,
      priority: dto.priority ?? BudgetItemPriority.MUST,
      paid: false,
    });

    return item.id;
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

  private async findSectionAndCheckOwnership(
    sectionId: number,
    budgetId: number,
  ): Promise<void> {
    const section = await this.sectionsRepository.findByIdOrFail(sectionId);
    if (section.budgetId !== budgetId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Budget section does not belong to user',
      });
    }
  }

  private async checkItemsLimit(sectionId: number): Promise<void> {
    const count = await this.itemsRepository.countBySectionId(sectionId);
    if (count >= 20) {
      throw new DomainException({
        code: DomainExceptionCode.Conflict,
        message: 'Maximum of 20 items per section reached',
      });
    }
  }
}
