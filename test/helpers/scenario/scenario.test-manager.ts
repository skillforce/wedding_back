import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { GLOBAL_PREFIX } from '../../../src/setup/global-prefix.setup';
import { CreateScenarioPointInputDto } from '../../../src/modules/scenario/api/input-dto/create-scenario-point.input-dto';
import { UpdateScenarioPointInputDto } from '../../../src/modules/scenario/api/input-dto/update-scenario-point.input-dto';
import { ScenarioPointIcon } from '../../../src/modules/scenario/domain/entities/scenario-point.entity';
import { ScenarioLocale } from '../../../src/modules/scenario/app/usecases/default-scenario-points';

export class ScenarioTestManager {
  private readonly httpServer: App;
  private sequence = 0;

  constructor(private readonly app: INestApplication) {
    this.httpServer = this.app.getHttpServer();
  }

  buildCreatePointDto(
    overrides: Partial<CreateScenarioPointInputDto> = {},
  ): CreateScenarioPointInputDto {
    this.sequence += 1;
    return {
      time:
        overrides.time ??
        `${String(Math.floor(this.sequence % 24)).padStart(2, '0')}:00`,
      title: overrides.title ?? `Event ${this.sequence}`,
      icon: overrides.icon ?? ScenarioPointIcon.Ceremony,
      note: overrides.note,
      duration: overrides.duration,
    };
  }

  buildUpdatePointDto(
    overrides: Partial<UpdateScenarioPointInputDto> = {},
  ): UpdateScenarioPointInputDto {
    return {
      time: overrides.time,
      title: overrides.title,
      icon: overrides.icon,
      note: overrides.note,
      duration: overrides.duration,
    };
  }

  async getScenario(
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .get(`/${GLOBAL_PREFIX}/scenario`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async seedScenario(
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
    locale?: ScenarioLocale,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .post(`/${GLOBAL_PREFIX}/scenario/seed`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (locale) req.query({ locale });
    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async createPoint(
    dto: CreateScenarioPointInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .post(`/${GLOBAL_PREFIX}/scenario/points`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async updatePoint(
    pointId: string,
    dto: UpdateScenarioPointInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .patch(`/${GLOBAL_PREFIX}/scenario/points/${pointId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async deletePoint(
    pointId: string,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .delete(`/${GLOBAL_PREFIX}/scenario/points/${pointId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }
}
