import { Module } from '@nestjs/common';
import { BcryptService } from './application/bcrypt.service';
import { UserAccountsConfig } from './config/user-accounts.config';
import { JwtStrategy } from './guards/bearer/jwt.strategy';
import { LocalStrategy } from './guards/local/local.strategy';
import { LoginUserUseCase } from './application/usecases/login-user.usecase';
import { GenerateNewTokenUsecase } from './application/usecases/generate-token.usecase';
import { GenerateRefreshTokenUsecase } from './application/usecases/generate-refresh-token.usecase';
import { RefreshTokenUsecase } from './application/usecases/refresh-token.usecase';
import { LogoutUsecase } from './application/usecases/logout.usecase';
import { ListActiveSessionsUseCase } from './application/usecases/list-active-sessions.usecase';
import { RevokeSessionUseCase } from './application/usecases/revoke-session.usecase';
import { RevokeAllOtherSessionsUseCase } from './application/usecases/revoke-all-other-sessions.usecase';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/entities/user.entity';
import { AuthSession } from './domain/entities/auth-session.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './api/auth-controller';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constants/auth-token.inject-context';
import { AuthService } from './application/auth.service';
import { CookieService } from './application/cookie.service';
import { CleanupSessionsService } from './application/cleanup-sessions.service';
import { UsersRepository } from './infra/users.repository';
import { AuthSessionsRepository } from './infra/auth-sessions.repository';
import { AuthSessionsQueryRepository } from './infra/query/auth-sessions.query-repository';
import { CreateUserUseCase } from './application/usecases/create-user.usecase';
import { DeleteUserUseCase } from './application/usecases/delete-user.usecase';
import { UserController } from './api/user-controller';
import { UsersQueryRepository } from './infra/query/users.query-repository';
import { RefreshTokenGuard } from './guards/refresh/refresh-token.guard';
import { S3Module } from '../../adapters/s3/s3.module';
import { ImageModule } from '../../adapters/image/image.module';
import { UserProfile } from './domain/entities/user-profile.entity';
import { UserProfilesRepository } from './infra/user-profiles.repository';
import { ProfileImageService } from './application/profile-image.service';
import { CreateDefaultProfileUseCase } from './application/usecases/create-default-profile.usecase';
import { UpdateProfileUseCase } from './application/usecases/update-profile.usecase';
import { UploadProfileImageUseCase } from './application/usecases/upload-profile-image.usecase';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AuthSession, UserProfile]),
    JwtModule,
    S3Module,
    ImageModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AuthController, UserController],
  providers: [
    BcryptService,
    CookieService,
    UserAccountsConfig,
    JwtStrategy,
    LocalStrategy,
    AuthService,
    CleanupSessionsService,
    LoginUserUseCase,
    GenerateNewTokenUsecase,
    GenerateRefreshTokenUsecase,
    RefreshTokenUsecase,
    LogoutUsecase,
    ListActiveSessionsUseCase,
    RevokeSessionUseCase,
    RevokeAllOtherSessionsUseCase,
    RefreshTokenGuard,
    UsersRepository,
    AuthSessionsRepository,
    AuthSessionsQueryRepository,
    UsersQueryRepository,
    UserProfilesRepository,
    ProfileImageService,
    CreateUserUseCase,
    DeleteUserUseCase,
    CreateDefaultProfileUseCase,
    UpdateProfileUseCase,
    UploadProfileImageUseCase,
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (userAccountsConfig: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: userAccountsConfig.accessTokenSecret,
          signOptions: {
            expiresIn: userAccountsConfig.accessTokenExpireIn,
          },
        });
      },
      inject: [UserAccountsConfig],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (userAccountsConfig: UserAccountsConfig): JwtService => {
        return new JwtService({
          secret: userAccountsConfig.refreshTokenSecret,
          signOptions: {
            expiresIn: userAccountsConfig.refreshTokenExpireIn as any,
          },
        });
      },
      inject: [UserAccountsConfig],
    },
  ],
  exports: [BcryptService],
})
export class UserAccountsModule {}