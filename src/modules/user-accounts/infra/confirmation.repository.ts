import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, MoreThan, Repository } from 'typeorm';
import { Confirmation, ConfirmationType } from '../domain/entities/confirmation.entity';

@Injectable()
export class ConfirmationRepository {
  constructor(
    @InjectRepository(Confirmation)
    private readonly ormRepository: Repository<Confirmation>,
  ) {}

  async save(
    confirmation: Omit<Confirmation, 'id' | 'createdAt' | 'updatedAt' | 'user'>,
  ): Promise<void> {
    await this.ormRepository.save(confirmation);
  }

  async findByToken(token: string, type: ConfirmationType): Promise<Confirmation | null> {
    return this.ormRepository.findOneBy({ token, type });
  }

  async findPendingByUserId(userId: number, type: ConfirmationType): Promise<Confirmation | null> {
    return this.ormRepository.findOne({
      where: { userId, type, confirmedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async invalidateAllForUser(userId: number, type: ConfirmationType): Promise<void> {
    await this.ormRepository.delete({ userId, type });
  }

  async markConfirmed(token: string): Promise<boolean> {
    const result = await this.ormRepository.update(
      { token, confirmedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      { confirmedAt: new Date() },
    );
    return result.affected === 1;
  }

  async markConfirmedWithManager(token: string, manager: EntityManager): Promise<boolean> {
    const result = await manager.update(
      Confirmation,
      { token, confirmedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      { confirmedAt: new Date() },
    );
    return result.affected === 1;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.ormRepository.countBy({ email });
    return count > 0;
  }
}