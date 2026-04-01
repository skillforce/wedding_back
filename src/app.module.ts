import { configModule } from './dynamic-config-module';
import { DynamicModule, Logger, Module, Provider } from '@nestjs/common';
import { CurrencyRefreshService } from './modules/currency/app/services/currency-refresh.service';
import { CurrencyRateQueryRepository } from './modules/currency/infra/query/currency-rate.query-repository';
import { BaseCurrency } from './modules/currency/domain/entities/base-currency.enum';
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
import { BudgetModule } from './modules/budget/budget.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { CurrencyModule } from './modules/currency/currency.module';
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
        const logger = new Logger('TypeOrmConfig');
        logger.log(`PG_DB_HOST: ${DBConfig.postgresHost}`);
        logger.log(`PG_DB_PORT: ${DBConfig.postgresPort}`);
        logger.log(`PG_DB_USER: ${DBConfig.postgresUser}`);
        logger.log(`PG_DB_NAME: ${DBConfig.postgresDatabase}`);
        logger.log(`PG_SSL_STATUS: ${DBConfig.postgresIsSSLEnabled}`);
        logger.log(`PG_IS_TESTING: ${DBConfig.isTesting}`);

        return {
          type: 'postgres',
          host: DBConfig.postgresHost,
          port: DBConfig.postgresPort,
          username: DBConfig.postgresUser,
          password: DBConfig.postgresPassword,
          database: DBConfig.postgresDatabase,
          ssl: DBConfig.postgresIsSSLEnabled,
          autoLoadEntities: true,
          synchronize: false,
        };
      },
      inject: [DBConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 5000,
        limit: 10,
      },
    ]),
    GuestsModule,
    SeatingArrangementsModule,
    UserAccountsModule,
    BudgetModule,
    ChecklistModule,
    CurrencyModule,
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
    const testingProviders = coreConfig.includeTestingModule
      ? [
          {
            provide: CurrencyRefreshService,
            useValue: { onModuleInit: async () => {}, refreshRates: async () => {} },
          },
          {
            provide: CurrencyRateQueryRepository,
            useValue: {
              findLatest: async () => ({
                base: BaseCurrency.USD,
                rates: { BYN: 3.27, RUB: 96.5 },
                updatedAt: new Date().toISOString(),
              }),
            },
          },
        ]
      : [];

    return {
      module: AppModule,
      imports: [...(coreConfig.includeTestingModule ? [TestingModule] : [])],
      providers: testingProviders,
    };
  }
}
