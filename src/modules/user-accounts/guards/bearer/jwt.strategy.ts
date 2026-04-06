import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserContextDto } from '../dto/user-context.dto';
import { UserAccountsConfig } from '../../config/user-accounts.config';
import { AuthSessionsRepository } from '../../infra/auth-sessions.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    readonly userAccountsConfig: UserAccountsConfig,
    private readonly authSessionsRepository: AuthSessionsRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: userAccountsConfig.accessTokenSecret,
    });
  }

  async validate(payload: UserContextDto): Promise<UserContextDto> {
    const session = await this.authSessionsRepository.findById(payload.sessionId);
    if (!session) {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
