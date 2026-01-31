import { configModule } from './dynamic-config-module';
import { DynamicModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreConfig } from './core/configs/core.config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SWAGGER_PREFIX } from './setup/swagger.setup';
import { CoreModule } from './core/core.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DBConfig } from './core/configs/db.config';

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

        return {
          type: 'postgres',
          host: DBConfig.postgresHost,
          port: DBConfig.postgresPort,
          username: DBConfig.postgresUser,
          password: DBConfig.postgresPassword,
          database: DBConfig.postgresDatabase,
          // ssl: true,
          ssl: false, // Set to true in case of using local db
          autoLoadEntities: true,
          synchronize: false,
        };
      },
      inject: [DBConfig],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  static forRoot(coreConfig: CoreConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [...(coreConfig.includeTestingModule ? [] : [])], // Add dynamic modules here if needed
    };
  }
}
