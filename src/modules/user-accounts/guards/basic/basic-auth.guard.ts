import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UserAccountsConfig } from '../../config/user-accounts.config';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(private readonly userAccountsConfig: UserAccountsConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Basic ')) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: 'Unauthorised',
      });
    }

    const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    if (
      username === this.userAccountsConfig.adminUsername &&
      password === this.userAccountsConfig.adminPassword
    ) {
      return true;
    }

    throw new DomainException({
      code: DomainExceptionCode.Unauthorized,
      message: 'Unauthorised',
    });
  }
}
