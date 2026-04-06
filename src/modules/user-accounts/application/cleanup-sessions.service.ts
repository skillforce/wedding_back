import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthSessionsRepository } from '../infra/auth-sessions.repository';

@Injectable()
export class CleanupSessionsService {
  constructor(
    private readonly authSessionsRepository: AuthSessionsRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredSessions(): Promise<void> {
    await this.authSessionsRepository.deleteExpired();
  }
}