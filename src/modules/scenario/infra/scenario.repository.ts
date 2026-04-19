import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Scenario } from '../domain/entities/scenario.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class ScenarioRepository {
  constructor(
    @InjectRepository(Scenario)
    private readonly scenarioOrmRepository: Repository<Scenario>,
  ) {}

  async findByUserId(userId: number): Promise<Scenario | null> {
    return this.scenarioOrmRepository.findOneBy({ userId });
  }

  async findByUserIdWithManager(
    manager: EntityManager,
    userId: number,
  ): Promise<Scenario | null> {
    return manager.getRepository(Scenario).findOneBy({ userId });
  }

  async findByUserIdOrFail(userId: number): Promise<Scenario> {
    const scenario = await this.findByUserId(userId);
    if (!scenario) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Scenario not found',
      });
    }
    return scenario;
  }

  async findByUserIdForUpdateOrFail(
    manager: EntityManager,
    userId: number,
  ): Promise<Scenario> {
    const scenario = await manager
      .getRepository(Scenario)
      .createQueryBuilder('scenario')
      .setLock('pessimistic_write')
      .where('scenario.user_id = :userId', { userId })
      .getOne();

    if (!scenario) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Scenario not found',
      });
    }

    return scenario;
  }

  async save(
    scenario: Omit<Scenario, 'id' | 'user' | 'points' | 'createdAt' | 'updatedAt'>,
  ): Promise<Scenario> {
    return this.scenarioOrmRepository.save(scenario);
  }

  async saveWithManager(
    manager: EntityManager,
    scenario: Omit<Scenario, 'id' | 'user' | 'points' | 'createdAt' | 'updatedAt'>,
  ): Promise<Scenario> {
    return manager.getRepository(Scenario).save(scenario);
  }
}