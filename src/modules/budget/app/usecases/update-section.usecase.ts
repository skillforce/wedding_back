import { CacheService } from '../../../../adapters/redis/cache.service';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BudgetRepository } from '../../infra/budget.repository';
import { BudgetSectionsRepository } from '../../infra/budget-sections.repository';
import { UpdateSectionInputDto } from '../../api/input-dto/update-section.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Budget } from '../../domain/entities/budget.entity';

export class UpdateSectionCommand {
  constructor(
    public readonly sectionId: number,
    public readonly dto: UpdateSectionInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(UpdateSectionCommand)
export class UpdateSectionUseCase
  implements ICommandHandler<UpdateSectionCommand, void>
{
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly sectionsRepository: BudgetSectionsRepository,
    private readonly cache: CacheService,
  ) {}

  async execute({ sectionId, dto, userId }: UpdateSectionCommand): Promise<void> {
    const budget = await this.findBudgetByUserIdOrFail(userId);
    await this.findSectionAndCheckOwnership(sectionId, budget.id);
    await this.sectionsRepository.update(sectionId, dto);
    await this.cache.evictBudget(userId);
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