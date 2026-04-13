import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsPositive } from 'class-validator';
import { configValidationUtility } from '../../../core/helpers/config-validation.utility';

@Injectable()
export class UserAccountsConfig {
  @IsNotEmpty({ message: 'Set Env variable FE_URL' })
  feUrl!: string;

  @IsNotEmpty({
    message: 'Set Env variable ACCESS_TOKEN_SECRET, dangerous for security!',
  })
  accessTokenSecret!: string;

  @IsNotEmpty({
    message: 'Set Env variable ACCESS_TOKEN_EXPIRE_IN, examples: 1h, 5m, 2d',
  })
  accessTokenExpireIn!: any;

  @IsNotEmpty({
    message: 'Set Env variable REFRESH_TOKEN_SECRET, dangerous for security!',
  })
  refreshTokenSecret!: string;

  @IsNotEmpty({
    message: 'Set Env variable REFRESH_TOKEN_EXPIRE_IN, examples: 30d, 7d',
  })
  refreshTokenExpireIn!: string;

  @IsPositive()
  maxSessionsPerUser!: number;

  @IsPositive({ message: 'Set Env variable CONFIRMATION_TOKEN_TTL_MS, e.g. 86400000 (24h)' })
  confirmationTokenTtlMs!: number;

  constructor(private readonly configService: ConfigService<any, true>) {
    this.feUrl = this.configService.get<string>('FE_URL');
    this.accessTokenExpireIn = this.configService.get<string>(
      'ACCESS_TOKEN_EXPIRE_IN',
    );
    this.accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
    );
    this.refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );
    this.refreshTokenExpireIn = this.configService.get<string>(
      'REFRESH_TOKEN_EXPIRE_IN',
    );
    this.maxSessionsPerUser = parseInt(
      this.configService.get<string>('MAX_SESSIONS_PER_USER') ?? 5,
    );
    this.confirmationTokenTtlMs = parseInt(
      this.configService.get<string>('CONFIRMATION_TOKEN_TTL_MS') ?? 86400000,
    );
    configValidationUtility.validateConfig(this);
  }
}
