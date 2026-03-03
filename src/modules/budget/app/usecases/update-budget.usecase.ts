import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BudgetRepository } from '../../infra/budget.repository';
import { UpdateBudgetInputDto } from '../../api/input-dto/update-budget.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Budget } from '../../domain/entities/budget.entity';

export class UpdateBudgetCommand {
  constructor(
    public readonly dto: UpdateBudgetInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(UpdateBudgetCommand)
export class UpdateBudgetUseCase
  implements ICommandHandler<UpdateBudgetCommand, void>
{
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute({ dto, userId }: UpdateBudgetCommand): Promise<void> {
    const budget = await this.findBudgetByUserIdOrFail(userId);
    await this.budgetRepository.update(budget.id, dto);
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
}