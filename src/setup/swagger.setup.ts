import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { get } from 'http';
import { createWriteStream } from 'fs';
import { CoreConfig } from '../core/configs/core.config';

export const SWAGGER_PREFIX = 'swagger';
export function swaggerSetup(app: INestApplication, coreConfig: CoreConfig) {
  if (coreConfig.isSwaggerEnabled) {
    const serverUrl = `http://localhost:${coreConfig.port}`;
    const config = new DocumentBuilder()
      .setTitle('WEDDING INVITATION API')
      .addBearerAuth()
      .setVersion('1.0.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(SWAGGER_PREFIX, app, document, {
      customSiteTitle: 'Blogger platform Swagger',
    });
    // write swagger ui files
    // get(`${serverUrl}/api/swagger-ui-bundle.js`, function (response) {
    //   response.pipe(createWriteStream('swagger-static/swagger-ui-bundle.js'));
    // });
    //
    // get(`${serverUrl}/api/swagger-ui-init.js`, function (response) {
    //   response.pipe(createWriteStream('swagger-static/swagger-ui-init.js'));
    // });
    //
    // get(
    //   `${serverUrl}/api/swagger-ui-standalone-preset.js`,
    //   function (response) {
    //     response.pipe(
    //       createWriteStream('swagger-static/swagger-ui-standalone-preset.js'),
    //     );
    //   },
    // );
    //
    // get(`${serverUrl}/api/swagger-ui.css`, function (response) {
    //   response.pipe(createWriteStream('swagger-static/swagger-ui.css'));
    // });
  }
}
