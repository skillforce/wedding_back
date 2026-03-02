import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../domain/entities/refresh-token.entity';

@Injectable()
export class RefreshTokensRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  async save(
    entity: Pick<RefreshToken, 'id' | 'userId' | 'tokenHash' | 'expiresAt'>,
  ): Promise<void> {
    await this.repo.save(entity);
  }

  async findById(id: string): Promise<RefreshToken | null> {
    return this.repo.findOneBy({ id });
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async deleteByUserId(userId: number): Promise<void> {
    await this.repo.delete({ userId });
  }
}