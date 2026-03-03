import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../domain/entities/budget.entity';

@Injectable()
export class BudgetRepository {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetOrmRepository: Repository<Budget>,
  ) {}

  async findByUserId(userId: number): Promise<Budget | null> {
    return this.budgetOrmRepository.findOneBy({ userId });
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