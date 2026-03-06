import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Checklist } from '../domain/entities/checklist.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class ChecklistRepository {
  constructor(
    @InjectRepository(Checklist)
    private readonly checklistOrmRepository: Repository<Checklist>,
  ) {}

  async findByUserId(userId: number): Promise<Checklist | null> {
    return this.checklistOrmRepository.findOneBy({ userId });
  }

  async findByUserIdWithManager(
    manager: EntityManager,
    userId: number,
  ): Promise<Checklist | null> {
    return manager.getRepository(Checklist).findOneBy({ userId });
  }

  async findByUserIdOrFail(userId: number): Promise<Checklist> {
    const checklist = await this.findByUserId(userId);
    if (!checklist) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Checklist not found',
      });
    }
    return checklist;
  }

  async findByUserIdForUpdateOrFail(
    manager: EntityManager,
    userId: number,
  ): Promise<Checklist> {
    const checklist = await manager
      .getRepository(Checklist)
      .createQueryBuilder('checklist')
      .setLock('pessimistic_write')
      .where('checklist.user_id = :userId', { userId })
      .getOne();

    if (!checklist) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Checklist not found',
      });
    }

    return checklist;
  }

  async save(
    checklist: Omit<Checklist, 'id' | 'user' | 'phases' | 'createdAt' | 'updatedAt'>,
  ): Promise<Checklist> {
    return this.checklistOrmRepository.save(checklist);
  }

  async saveWithManager(
    manager: EntityManager,
    checklist: Omit<Checklist, 'id' | 'user' | 'phases' | 'createdAt' | 'updatedAt'>,
  ): Promise<Checklist> {
    return manager.getRepository(Checklist).save(checklist);
  }
}
