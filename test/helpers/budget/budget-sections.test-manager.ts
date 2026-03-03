import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CreateSectionInputDto } from '../../../src/modules/budget/api/input-dto/create-section.input-dto';
import { UpdateSectionInputDto } from '../../../src/modules/budget/api/input-dto/update-section.input-dto';
import { GLOBAL_PREFIX } from '../../../src/setup/global-prefix.setup';

export class BudgetSectionsTestManager {
  private readonly httpServer: App;
  private sequence = 0;

  constructor(private readonly app: INestApplication) {
    this.httpServer = this.app.getHttpServer();
  }

  buildCreateSectionDto(
    overrides: Partial<CreateSectionInputDto> = {},
  ): CreateSectionInputDto {
    this.sequence += 1;
    return {
      name: overrides.name ?? `Section ${this.sequence}`,
    };
  }

  async createSection(
    dto: CreateSectionInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
  ) {
    const response = await request(this.httpServer)
      .post(`/${GLOBAL_PREFIX}/budget/sections`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async updateSection(
    id: number,
    dto: UpdateSectionInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const response = await request(this.httpServer)
      .patch(`/${GLOBAL_PREFIX}/budget/sections/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async deleteSection(
    id: number,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.httpServer)
      .delete(`/${GLOBAL_PREFIX}/budget/sections/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return response.body;
  }
}