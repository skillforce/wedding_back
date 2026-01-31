import { INestApplication } from '@nestjs/common';
import { swaggerSetup } from './swagger.setup';
import { globalPrefixSetup } from './global-prefix.setup';
import { CoreConfig } from '../core/configs/core.config';

export function appSetup(app: INestApplication, coreConfig: CoreConfig) {
  app.enableCors();
  globalPrefixSetup(app);
  swaggerSetup(app, coreConfig);
}
