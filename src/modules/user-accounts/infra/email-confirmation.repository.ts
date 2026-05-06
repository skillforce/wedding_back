import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { EmailConfirmation } from '../domain/entities/email-confirmation.entity';

@Injectable()
export class EmailConfirmationRepository {
  constructor(
    @InjectRepository(EmailConfirmation)
    private readonly ormRepository: Repository<EmailConfirmation>,
  ) {}

  async save(confirmation: Omit<EmailConfirmation, 'id' | 'createdAt' | 'updatedAt' | 'user'>): Promise<void> {
    await this.ormRepository.save(confirmation);
  }

  async findByToken(token: string): Promise<EmailConfirmation | null> {
    return this.ormRepository.findOneBy({ token });
  }

  async findPendingByUserId(userId: number): Promise<EmailConfirmation | null> {
    return this.ormRepository.findOne({
      where: { userId, confirmedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async invalidateAllForUser(userId: number): Promise<void> {
    await this.ormRepository.delete({ userId });
  }

  async markConfirmed(token: string): Promise<boolean> {
    const result = await this.ormRepository.update(
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