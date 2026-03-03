import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetSection } from '../domain/entities/budget-section.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BudgetSectionsRepository {
  constructor(
    @InjectRepository(BudgetSection)
    private readonly sectionOrmRepository: Repository<BudgetSection>,
  ) {}

  async findByIdOrFail(id: number): Promise<BudgetSection> {
    const section = await this.sectionOrmRepository.findOneBy({ id });
    if (!section) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget section not found',
      });
    }
    return section;
  }

  async findByIdAndBudgetIdOrFail(
    id: number,
    budgetId: number,
  ): Promise<BudgetSection> {
    const section = await this.sectionOrmRepository.findOneBy({
      id,
      budgetId,
    });
    if (!section) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget section not found',
      });
    }
    return section;
  }

  async countByBudgetId(budgetId: number): Promise<number> {
    return this.sectionOrmRepository.countBy({ budgetId });
  }

  async save(
    section: Omit<BudgetSection, 'id' | 'budget' | 'items' | 'createdAt' | 'updatedAt'>,
  ): Promise<BudgetSection> {
    return this.sectionOrmRepository.save(section);
  }

  async update(id: number, updates: Partial<BudgetSection>): Promise<void> {
    await this.sectionOrmRepository.update(id, updates);
  }

  async deleteByIdOrFail(id: number): Promise<void> {
    const result = await this.sectionOrmRepository.delete(id);
    if (result.affected === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget section not found',
      });
    }
  }
}