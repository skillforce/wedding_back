import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BudgetRepository } from '../../infra/budget.repository';
import { UpdateBudgetInputDto } from '../../api/input-dto/update-budget.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Budget } from '../../domain/entities/budget.entity';
import { CACHE_INVALIDATOR, CachePrefix } from '../../../../adapters/redis/constants';
import { ICacheInvalidator } from '../../../../adapters/redis/cache-invalidator';
import { CacheKey } from '../../../../adapters/redis/cache-key';

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
  constructor(
    private readonly budgetRepository: BudgetRepository,
    @Inject(CACHE_INVALIDATOR) private readonly cacheInvalidator: ICacheInvalidator,
  ) {}

  async execute({ dto, userId }: UpdateBudgetCommand): Promise<void> {
    const budget = await this.findBudgetByUserIdOrFail(userId);
    await this.budgetRepository.update(budget.id, dto);
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
}