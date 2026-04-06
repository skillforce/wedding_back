import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Not, Repository } from 'typeorm';
import { AuthSession } from '../domain/entities/auth-session.entity';

@Injectable()
export class AuthSessionsRepository {
  constructor(
    @InjectRepository(AuthSession)
    private readonly repo: Repository<AuthSession>,
  ) {}

  async save(
    entity: Pick<
      AuthSession,
      | 'id'
      | 'userId'
      | 'refreshTokenHash'
      | 'expiresAt'
      | 'deviceId'
      | 'userAgent'
      | 'deviceName'
      | 'lastActiveAt'
    >,
  ): Promise<void> {
    await this.repo.save(entity);
  }

  async findById(id: string): Promise<AuthSession | null> {
    return this.repo.findOneBy({ id });
  }

  async findByUserAndDevice(
    userId: number,
    deviceId: string,
  ): Promise<AuthSession | null> {
    return this.repo.findOneBy({ userId, deviceId });
  }

  async findOldestActiveByUserId(userId: number): Promise<AuthSession | null> {
    return this.repo.findOne({
      where: { userId, expiresAt: MoreThan(new Date()) },
      order: { lastActiveAt: 'ASC' },
    });
  }

  async countActiveByUserId(userId: number): Promise<number> {
    return this.repo.count({
      where: { userId, expiresAt: MoreThan(new Date()) },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async deleteAllByUserId(userId: number): Promise<void> {
    await this.repo.delete({ userId });
  }

  async deleteAllByUserIdExcept(
    userId: number,
    sessionId: string,
  ): Promise<void> {
    await this.repo.delete({ userId, id: Not(sessionId) });
  }

  async deleteExpired(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }

}