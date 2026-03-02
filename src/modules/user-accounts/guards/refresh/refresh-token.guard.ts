import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../constants/auth-token.inject-context';
import { UserRefreshContextDto } from '../dto/user-refresh-context.dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private readonly refreshTokenContext: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<
      Request & { user: UserRefreshContextDto; refreshToken: string }
    >();

    const token: string | undefined = request.cookies?.refreshToken;

    if (!token) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        extensions: [
          { field: 'refreshToken', message: 'Refresh token is missing' },
        ],
        message: 'Unauthorized',
      });
    }

    try {
      const payload =
        this.refreshTokenContext.verify<UserRefreshContextDto>(token);
      request.user = payload;
      request.refreshToken = token;
    } catch (e: any) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        extensions: [
          {
            field: 'refreshToken',
            message: e?.message ?? 'Invalid refresh token',
          },
        ],
        message: 'Unauthorized',
      });
    }

    return true;
  }
}