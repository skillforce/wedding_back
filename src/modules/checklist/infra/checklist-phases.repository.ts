import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ChecklistPhase } from '../domain/entities/checklist-phase.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class ChecklistPhasesRepository {
  constructor(
    @InjectRepository(ChecklistPhase)
    private readonly phasesOrmRepository: Repository<ChecklistPhase>,
  ) {}

  async countByChecklistId(
    checklistId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repository =
      manager?.getRepository(ChecklistPhase) ?? this.phasesOrmRepository;
    return repository.countBy({ checklistId });
  }

  async findMaxSortOrderByChecklistId(
    checklistId: string,
    manager?: EntityManager,
  ): Promise<number | null> {
    const repository =
      manager?.getRepository(ChecklistPhase) ?? this.phasesOrmRepository;
    const result = await repository
      .createQueryBuilder('phase')
      .select('MAX(phase.sort_order)', 'maxSortOrder')
      .where('phase.checklist_id = :checklistId', { checklistId })
      .getRawOne<{ maxSortOrder: string | null }>();

    return result?.maxSortOrder === null || result?.maxSortOrder === undefined
      ? null
      : Number(result.maxSortOrder);
  }

  async findByIdForUpdateOrFail(
    manager: EntityManager,
    id: string,
  ): Promise<ChecklistPhase> {
    const phase = await manager
      .getRepository(ChecklistPhase)
      .createQueryBuilder('phase')
      .innerJoinAndSelect('phase.checklist', 'checklist')
      .setLock('pessimistic_write')
      .where('phase.id = :id', { id })
      .getOne();

    if (!phase) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Checklist phase not found',
      });
    }

    return phase;
  }

  async findByChecklistIdForUpdate(
    manager: EntityManager,
    checklistId: string,
  ): Promise<ChecklistPhase[]> {
    return manager
      .getRepository(ChecklistPhase)
      .createQueryBuilder('phase')
      .setLock('pessimistic_write')
      .where('phase.checklist_id = :checklistId', { checklistId })
      .orderBy('phase.sort_order', 'ASC')
      .getMany();
  }

  async save(
    phase: Omit<
      ChecklistPhase,
      'id' | 'checklist' | 'items' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<ChecklistPhase> {
    return this.phasesOrmRepository.save(phase);
  }

  async saveWithManager(
    manager: EntityManager,
    phase: Omit<
      ChecklistPhase,
      'id' | 'checklist' | 'items' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<ChecklistPhase> {
    return manager.getRepository(ChecklistPhase).save(phase);
  }

  async saveEntityWithManager(
    manager: EntityManager,
    phase: ChecklistPhase,
  ): Promise<ChecklistPhase> {
    return manager.getRepository(ChecklistPhase).save(phase);
  }

  async saveManyWithManager(
    manager: EntityManager,
    phases: Array<
      Omit<
        ChecklistPhase,
        'id' | 'checklist' | 'items' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<ChecklistPhase[]> {
    return manager.getRepository(ChecklistPhase).save(phases);
  }

  async deleteByIdWithManager(
    manager: EntityManager,
    id: string,
  ): Promise<void> {
    await manager.getRepository(ChecklistPhase).delete({ id });
  }

  async deleteByChecklistIdWithManager(
    manager: EntityManager,
    checklistId: string,
  ): Promise<void> {
    await manager.getRepository(ChecklistPhase).delete({ checklistId });
  }
}
