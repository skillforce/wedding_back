import { Module } from '@nestjs/common';
import { BcryptService } from './application/bcrypt.service';
import { UserAccountsConfig } from './config/user-accounts.config';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { LocalStrategy } from './guards/local/local.strategy';
import { LoginUserUseCase } from './application/usecases/login-user.usecase';
import { GenerateNewTokenUsecase } from './application/usecases/generate-token.usecase';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entities/user.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './api/auth-controller';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from './constants/auth-token.inject-context';

@Module({
  imports: [TypeOrmModule.forFeature([User]), JwtModule],
  controllers: [AuthController],
  providers: [
    BcryptService,
    UserAccountsConfig,
    JwtStrategy,
    LocalStrategy,
    LoginUserUseCase,
    GenerateNewTokenUsecase,
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (userAccountConfig: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: userAccountConfig.accessTokenSecret,
          signOptions: {
            expiresIn: userAccountConfig.accessTokenExpireIn,
          },
        });
      },
      inject: [UserAccountsConfig],
    },
  ],
  exports: [BcryptService],
})
export class UserAccountsModule {}
