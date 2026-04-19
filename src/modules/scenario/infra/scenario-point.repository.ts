import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';
import { ScenarioPoint } from '../domain/entities/scenario-point.entity';
import { DomainException } from '../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Injectable()
export class ScenarioPointRepository {
  constructor(
    @InjectRepository(ScenarioPoint)
    private readonly pointOrmRepository: Repository<ScenarioPoint>,
  ) {}

  async countByScenarioId(
    scenarioId: string,
    manager?: EntityManager,
  ): Promise<number> {
    return this.repo(manager).countBy({ scenarioId });
  }

  async findByScenarioIdAndTime(
    scenarioId: string,
    time: string,
    manager?: EntityManager,
  ): Promise<ScenarioPoint | null> {
    return this.repo(manager).findOneBy({ scenarioId, time });
  }

  async findByIdForUpdateOrFail(
    manager: EntityManager,
    id: string,
  ): Promise<ScenarioPoint> {
    const point = await this.repo(manager)
      .createQueryBuilder('point')
      .innerJoinAndSelect('point.scenario', 'scenario')
      .setLock('pessimistic_write')
      .where('point.id = :id', { id })
      .getOne();

    if (!point) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Scenario point not found',
      });
    }

    return point;
  }

  async saveWithManager(
    manager: EntityManager,
    point: Omit<ScenarioPoint, 'id' | 'scenario' | 'createdAt' | 'updatedAt'>,
  ): Promise<ScenarioPoint> {
    return this.repo(manager).save(point);
  }

  async saveEntityWithManager(
    manager: EntityManager,
    point: ScenarioPoint,
  ): Promise<ScenarioPoint> {
    return this.repo(manager).save(point);
  }

  async saveManyWithManager(
    manager: EntityManager,
    points: Array<DeepPartial<ScenarioPoint>>,
  ): Promise<ScenarioPoint[]> {
    return this.repo(manager).save(points);
  }

  async deleteByIdWithManager(
    manager: EntityManager,
    id: string,
  ): Promise<void> {
    await this.repo(manager).delete({ id });
  }

  async deleteByScenarioIdWithManager(
    manager: EntityManager,
    scenarioId: string,
  ): Promise<void> {
    await this.repo(manager).delete({ scenarioId });
  }

  private repo(manager?: EntityManager): Repository<ScenarioPoint> {
    return manager?.getRepository(ScenarioPoint) ?? this.pointOrmRepository;
  }
}