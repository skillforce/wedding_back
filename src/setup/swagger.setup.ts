import { INestApplication } from '@nestjs/common';
import { CoreConfig } from '../core/configs/core.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PREFIX = 'swagger';

export function swaggerSetup(app: INestApplication, coreConfig: CoreConfig) {
  if (!coreConfig.isSwaggerEnabled) return;

  const config = new DocumentBuilder()
    .setTitle('WEDDING INVITATION API')
    .setDescription('Wedding Invitation API documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_PREFIX, app, document, {
    customSiteTitle: 'Wedding API Swagger',
  });
}
