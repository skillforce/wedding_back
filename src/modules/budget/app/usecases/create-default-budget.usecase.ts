import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BudgetRepository } from '../../infra/budget.repository';
import { BudgetCurrency } from '../../domain/entities/budget.entity';

export class CreateDefaultBudgetCommand {
  constructor(public readonly userId: number) {}
}

@CommandHandler(CreateDefaultBudgetCommand)
export class CreateDefaultBudgetUseCase
  implements ICommandHandler<CreateDefaultBudgetCommand, void>
{
  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute({ userId }: CreateDefaultBudgetCommand): Promise<void> {
    await this.budgetRepository.save({
      userId,
      budgetLimit: 0,
      currency: BudgetCurrency.BYN,
    });
  }
}