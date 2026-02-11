import { INestApplication } from '@nestjs/common';
import { swaggerSetup } from './swagger.setup';
import { globalPrefixSetup } from './global-prefix.setup';
import { CoreConfig } from '../core/configs/core.config';
import { pipesSetup } from './pipes.setup';

export function appSetup(app: INestApplication, coreConfig: CoreConfig) {
  app.enableCors();
  globalPrefixSetup(app);
  app.getHttpAdapter().getInstance().set('trust proxy', true);
  swaggerSetup(app, coreConfig);
  pipesSetup(app);
}
