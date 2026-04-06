import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { AuthSession } from '../../domain/entities/auth-session.entity';

@Injectable()
export class AuthSessionsQueryRepository {
  constructor(
    @InjectRepository(AuthSession)
    private readonly repo: Repository<AuthSession>,
  ) {}

  async findActiveByUserId(userId: number): Promise<AuthSession[]> {
    return this.repo.find({
      where: { userId, expiresAt: MoreThan(new Date()) },
      order: { lastActiveAt: 'DESC' },
    });
  }
}