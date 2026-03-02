import { Injectable } from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { CoreConfig, Environments } from '../../../core/configs/core.config';

const REFRESH_COOKIE = 'refreshToken';

@Injectable()
export class CookieService {
  constructor(private readonly coreConfig: CoreConfig) {}

  private getCookieOptions(): CookieOptions {
    const isProduction = this.coreConfig.env === Environments.PRODUCTION;

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    };
  }

  setRefreshToken(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, this.getCookieOptions());
  }

  clearRefreshToken(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, this.getCookieOptions());
  }
}
