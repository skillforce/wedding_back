import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BudgetRepository } from '../../infra/budget.repository';
import { BudgetSectionsRepository } from '../../infra/budget-sections.repository';
import { CreateSectionInputDto } from '../../api/input-dto/create-section.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Budget } from '../../domain/entities/budget.entity';

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
    private readonly budgetRepository: BudgetRepository,
    private readonly sectionsRepository: BudgetSectionsRepository,
  ) {}

  async execute({ dto, userId }: CreateSectionCommand): Promise<number> {
    const budget = await this.findBudgetByUserIdOrFail(userId);
    await this.checkSectionsLimit(budget.id);

    const section = await this.sectionsRepository.save({
      budgetId: budget.id,
      name: dto.name,
    });

    return section.id;
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

  private async checkSectionsLimit(budgetId: number): Promise<void> {
    const count = await this.sectionsRepository.countByBudgetId(budgetId);
    if (count >= 30) {
      throw new DomainException({
        code: DomainExceptionCode.Conflict,
        message: 'Maximum of 30 sections per budget reached',
      });
    }
  }
}