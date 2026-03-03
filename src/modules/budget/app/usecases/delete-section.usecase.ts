import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BudgetRepository } from '../../infra/budget.repository';
import { BudgetSectionsRepository } from '../../infra/budget-sections.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Budget } from '../../domain/entities/budget.entity';

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
    private readonly budgetRepository: BudgetRepository,
    private readonly sectionsRepository: BudgetSectionsRepository,
  ) {}

  async execute({ sectionId, userId }: DeleteSectionCommand): Promise<void> {
    const budget = await this.findBudgetByUserIdOrFail(userId);
    await this.findSectionAndCheckOwnership(sectionId, budget.id);
    await this.sectionsRepository.deleteByIdOrFail(sectionId);
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

  private async findSectionAndCheckOwnership(sectionId: number, budgetId: number): Promise<void> {
    const section = await this.sectionsRepository.findByIdOrFail(sectionId);
    if (section.budgetId !== budgetId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Budget section does not belong to user',
      });
    }
  }
}