import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Budget } from '../domain/entities/budget.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BudgetRepository {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetOrmRepository: Repository<Budget>,
  ) {}

  async findByUserId(userId: number): Promise<Budget | null> {
    return this.budgetOrmRepository.findOneBy({ userId });
  }

  async findByUserIdForUpdateOrFail(
    manager: EntityManager,
    userId: number,
  ): Promise<Budget> {
    const budget = await manager
      .getRepository(Budget)
      .createQueryBuilder('budget')
      .setLock('pessimistic_write')
      .where('budget.userId = :userId', { userId })
      .getOne();

    if (!budget) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget not found',
      });
    }

    return budget;
  }

  async save(
    budget: Omit<Budget, 'id' | 'user' | 'sections' | 'createdAt' | 'updatedAt'>,
  ): Promise<Budget> {
    return this.budgetOrmRepository.save(budget);
  }

  async update(id: number, updates: Partial<Budget>): Promise<void> {
    await this.budgetOrmRepository.update(id, updates);
  }
}
