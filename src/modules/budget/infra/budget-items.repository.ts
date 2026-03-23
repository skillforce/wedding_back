import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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

  async countBySectionId(
    sectionId: number,
    manager?: EntityManager,
  ): Promise<number> {
    const repository =
      manager?.getRepository(BudgetItem) ?? this.itemOrmRepository;
    return repository.countBy({ sectionId });
  }

  async findMaxSortOrderBySectionId(
    sectionId: number,
    manager?: EntityManager,
  ): Promise<number | null> {
    const repository =
      manager?.getRepository(BudgetItem) ?? this.itemOrmRepository;
    const result = await repository
      .createQueryBuilder('item')
      .select('MAX(item.sortOrder)', 'maxSortOrder')
      .where('item.sectionId = :sectionId', { sectionId })
      .getRawOne<{ maxSortOrder: string | null }>();

    return result?.maxSortOrder === null || result?.maxSortOrder === undefined
      ? null
      : Number(result.maxSortOrder);
  }

  async findByIdForUpdateOrFail(
    manager: EntityManager,
    id: number,
  ): Promise<BudgetItem> {
    const item = await manager
      .getRepository(BudgetItem)
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.section', 'section')
      .innerJoinAndSelect('section.budget', 'budget')
      .setLock('pessimistic_write')
      .where('item.id = :id', { id })
      .getOne();

    if (!item) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget item not found',
      });
    }

    return item;
  }

  async findBySectionIdForUpdate(
    manager: EntityManager,
    sectionId: number,
  ): Promise<BudgetItem[]> {
    return manager
      .getRepository(BudgetItem)
      .createQueryBuilder('item')
      .setLock('pessimistic_write')
      .where('item.sectionId = :sectionId', { sectionId })
      .orderBy('item.sortOrder', 'ASC')
      .getMany();
  }

  async save(
    item: Omit<BudgetItem, 'id' | 'section' | 'createdAt' | 'updatedAt'>,
  ): Promise<BudgetItem> {
    return this.itemOrmRepository.save(item);
  }

  async saveWithManager(
    manager: EntityManager,
    item: Omit<BudgetItem, 'id' | 'section' | 'createdAt' | 'updatedAt'>,
  ): Promise<BudgetItem> {
    return manager.getRepository(BudgetItem).save(item);
  }

  async saveManyWithManager(
    manager: EntityManager,
    items: BudgetItem[],
  ): Promise<BudgetItem[]> {
    return manager.getRepository(BudgetItem).save(items);
  }

  async update(id: number, updates: Partial<BudgetItem>): Promise<void> {
    await this.itemOrmRepository.update(id, updates);
  }

  async deleteByIdWithManager(
    manager: EntityManager,
    id: number,
  ): Promise<void> {
    await manager.getRepository(BudgetItem).delete({ id });
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
