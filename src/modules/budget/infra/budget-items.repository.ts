import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetItem } from '../domain/entities/budget-item.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BudgetItemsRepository {
  constructor(
    @InjectRepository(BudgetItem)
    private readonly itemOrmRepository: Repository<BudgetItem>,
  ) {}

  async findByIdOrFail(id: number): Promise<BudgetItem> {
    const item = await this.itemOrmRepository.findOne({
      where: { id },
      relations: ['section'],
    });
    if (!item) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget item not found',
      });
    }
    return item;
  }

  async findByIdAndBudgetIdOrFail(
    id: number,
    budgetId: number,
  ): Promise<BudgetItem> {
    const item = await this.itemOrmRepository.findOne({
      where: { id, section: { budgetId } },
      relations: ['section'],
    });
    if (!item) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget item not found',
      });
    }
    return item;
  }

  async countBySectionId(sectionId: number): Promise<number> {
    return this.itemOrmRepository.countBy({ sectionId });
  }

  async save(
    item: Omit<BudgetItem, 'id' | 'section' | 'createdAt' | 'updatedAt'>,
  ): Promise<BudgetItem> {
    return this.itemOrmRepository.save(item);
  }

  async update(id: number, updates: Partial<BudgetItem>): Promise<void> {
    await this.itemOrmRepository.update(id, updates);
  }

  async deleteByIdOrFail(id: number): Promise<void> {
    const result = await this.itemOrmRepository.delete(id);
    if (result.affected === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget item not found',
      });
    }
  }
}