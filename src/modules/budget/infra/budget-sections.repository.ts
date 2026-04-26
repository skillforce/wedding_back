import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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

  async countByBudgetId(
    budgetId: number,
    manager?: EntityManager,
  ): Promise<number> {
    const repository =
      manager?.getRepository(BudgetSection) ?? this.sectionOrmRepository;
    return repository.countBy({ budgetId });
  }

  async existsByBudgetIdAndName(
    budgetId: number,
    name: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repository =
      manager?.getRepository(BudgetSection) ?? this.sectionOrmRepository;
    return repository.existsBy({ budgetId, name });
  }

  async findMaxSortOrderByBudgetId(
    budgetId: number,
    manager?: EntityManager,
  ): Promise<number | null> {
    const repository =
      manager?.getRepository(BudgetSection) ?? this.sectionOrmRepository;
    const result = await repository
      .createQueryBuilder('section')
      .select('MAX(section.sortOrder)', 'maxSortOrder')
      .where('section.budgetId = :budgetId', { budgetId })
      .getRawOne<{ maxSortOrder: string | null }>();

    return result?.maxSortOrder === null || result?.maxSortOrder === undefined
      ? null
      : Number(result.maxSortOrder);
  }

  async findByIdForUpdateOrFail(
    manager: EntityManager,
    id: number,
  ): Promise<BudgetSection> {
    const section = await manager
      .getRepository(BudgetSection)
      .createQueryBuilder('section')
      .innerJoinAndSelect('section.budget', 'budget')
      .setLock('pessimistic_write')
      .where('section.id = :id', { id })
      .getOne();

    if (!section) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Budget section not found',
      });
    }

    return section;
  }

  async findByBudgetIdForUpdate(
    manager: EntityManager,
    budgetId: number,
  ): Promise<BudgetSection[]> {
    return manager
      .getRepository(BudgetSection)
      .createQueryBuilder('section')
      .setLock('pessimistic_write')
      .where('section.budgetId = :budgetId', { budgetId })
      .orderBy('section.sortOrder', 'ASC')
      .getMany();
  }

  async save(
    section: Omit<
      BudgetSection,
      'id' | 'budget' | 'items' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<BudgetSection> {
    return this.sectionOrmRepository.save(section);
  }

  async saveWithManager(
    manager: EntityManager,
    section: Omit<
      BudgetSection,
      'id' | 'budget' | 'items' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<BudgetSection> {
    return manager.getRepository(BudgetSection).save(section);
  }

  async saveManyWithManager(
    manager: EntityManager,
    sections: BudgetSection[],
  ): Promise<BudgetSection[]> {
    return manager.getRepository(BudgetSection).save(sections);
  }

  async update(id: number, updates: Partial<BudgetSection>): Promise<void> {
    await this.sectionOrmRepository.update(id, updates);
  }

  async deleteByIdWithManager(
    manager: EntityManager,
    id: number,
  ): Promise<void> {
    await manager.getRepository(BudgetSection).delete({ id });
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
