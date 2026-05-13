import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Strategy } from 'passport-local';
import { AuthService } from '../../application/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'loginOrEmail' });
  }

  async validate(
    loginOrEmail: string,
    password: string,
  ): Promise<{ id: number }> {
    const user = await this.authService.validateUser(loginOrEmail, password);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        extensions: [
          {
            field: 'loginOrEmail',
            message: 'Invalid username or password',
          },
          {
            field: 'password',
            message: 'Invalid username or password',
          },
        ],
        message: 'Invalid login or password',
      });
    }

    return user;
  }
}
