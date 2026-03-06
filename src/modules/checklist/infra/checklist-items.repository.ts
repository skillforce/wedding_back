import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ChecklistItem } from '../domain/entities/checklist-item.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class ChecklistItemsRepository {
  constructor(
    @InjectRepository(ChecklistItem)
    private readonly itemsOrmRepository: Repository<ChecklistItem>,
  ) {}

  async countByPhaseId(
    phaseId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repository =
      manager?.getRepository(ChecklistItem) ?? this.itemsOrmRepository;
    return repository.countBy({ phaseId });
  }

  async findMaxSortOrderByPhaseId(
    phaseId: string,
    manager?: EntityManager,
  ): Promise<number | null> {
    const repository =
      manager?.getRepository(ChecklistItem) ?? this.itemsOrmRepository;
    const result = await repository
      .createQueryBuilder('item')
      .select('MAX(item.sort_order)', 'maxSortOrder')
      .where('item.phase_id = :phaseId', { phaseId })
      .getRawOne<{ maxSortOrder: string | null }>();

    return result?.maxSortOrder === null || result?.maxSortOrder === undefined
      ? null
      : Number(result.maxSortOrder);
  }

  async findByIdForUpdateOrFail(
    manager: EntityManager,
    id: string,
  ): Promise<ChecklistItem> {
    const item = await manager
      .getRepository(ChecklistItem)
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.phase', 'phase')
      .innerJoinAndSelect('phase.checklist', 'checklist')
      .setLock('pessimistic_write')
      .where('item.id = :id', { id })
      .getOne();

    if (!item) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Checklist item not found',
      });
    }

    return item;
  }

  async findByIdAndPhaseIdForUpdateOrFail(
    manager: EntityManager,
    id: string,
    phaseId: string,
  ): Promise<ChecklistItem> {
    const item = await manager
      .getRepository(ChecklistItem)
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.phase', 'phase')
      .innerJoinAndSelect('phase.checklist', 'checklist')
      .setLock('pessimistic_write')
      .where('item.id = :id', { id })
      .andWhere('item.phase_id = :phaseId', { phaseId })
      .getOne();

    if (!item) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Checklist item not found',
      });
    }

    return item;
  }

  async findByPhaseIdForUpdate(
    manager: EntityManager,
    phaseId: string,
  ): Promise<ChecklistItem[]> {
    return manager
      .getRepository(ChecklistItem)
      .createQueryBuilder('item')
      .setLock('pessimistic_write')
      .where('item.phase_id = :phaseId', { phaseId })
      .orderBy('item.sort_order', 'ASC')
      .getMany();
  }

  async saveWithManager(
    manager: EntityManager,
    item: Omit<ChecklistItem, 'id' | 'phase' | 'createdAt' | 'updatedAt'>,
  ): Promise<ChecklistItem> {
    return manager.getRepository(ChecklistItem).save(item);
  }

  async saveEntityWithManager(
    manager: EntityManager,
    item: ChecklistItem,
  ): Promise<ChecklistItem> {
    return manager.getRepository(ChecklistItem).save(item);
  }

  async saveManyWithManager(
    manager: EntityManager,
    items: ChecklistItem[],
  ): Promise<ChecklistItem[]> {
    return manager.getRepository(ChecklistItem).save(items);
  }

  async deleteByIdWithManager(
    manager: EntityManager,
    id: string,
  ): Promise<void> {
    await manager.getRepository(ChecklistItem).delete({ id });
  }
}
