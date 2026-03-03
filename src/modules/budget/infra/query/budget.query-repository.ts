import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../../domain/entities/budget.entity';
import { BudgetViewDto } from '../../api/view-dto/budget.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BudgetQueryRepository {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetOrmRepository: Repository<Budget>,
  ) {}

  async findFullBudgetByUserId(userId: number): Promise<BudgetViewDto> {
    const budget = await this.budgetOrmRepository.findOne({
      where: { userId },
      relations: ['sections', 'sections.items'],
    });
    if (!budget) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget not found',
      });
    }
    return BudgetViewDto.mapToViewDto(budget);
  }
}