import { configModule } from './dynamic-config-module';
import { DynamicModule, Module } from '@nestjs/common';
import { CoreConfig } from './core/configs/core.config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SWAGGER_PREFIX } from './setup/swagger.setup';
import { CoreModule } from './core/core.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DBConfig } from './core/configs/db.config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllHttpExceptionsFilter } from './core/exceptions/filters/all-exceptions.filter';
import { DomainHttpExceptionsFilter } from './core/exceptions/filters/domain-exceptions.filter';
import { GuestsModule } from './modules/guests/guests.module';
import { SeatingArrangementsModule } from './modules/seating-arrangements/seating-arrangements.module';
import { TestingModule } from './modules/testing/testing.module';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    configModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'swagger-static'),
      serveRoot: SWAGGER_PREFIX,
    }),
    CoreModule,
    TypeOrmModule.forRootAsync({
      useFactory: (DBConfig: DBConfig) => {
        console.log('PG_DB_URI', DBConfig.postgresHost);
        console.log('PG_DB_PORT', DBConfig.postgresPort);
        console.log('PG_DB_USER', DBConfig.postgresUser);
        console.log('PG_DB_PASSWORD', DBConfig.postgresPassword);
        console.log('PG_DB_NAME', DBConfig.postgresDatabase);
        console.log('PG_SSL_STATUS', DBConfig.postgresIsSSLEnabled);
        console.log('PD_IS_TESTING', DBConfig.isTesting);

        return {
          type: 'postgres',
          host: DBConfig.postgresHost,
          port: DBConfig.postgresPort,
          username: DBConfig.postgresUser,
          password: DBConfig.postgresPassword,
          database: DBConfig.postgresDatabase,
          ssl: DBConfig.postgresIsSSLEnabled,
          autoLoadEntities: true,
          synchronize: DBConfig.isTesting,
        };
      },
      inject: [DBConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),
    GuestsModule,
    SeatingArrangementsModule,
    UserAccountsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainHttpExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  static forRoot(coreConfig: CoreConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [...(coreConfig.includeTestingModule ? [TestingModule] : [])], // Add dynamic modules here if needed
    };
  }
}
