import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CreateItemInputDto } from '../../../src/modules/budget/api/input-dto/create-item.input-dto';
import { UpdateItemInputDto } from '../../../src/modules/budget/api/input-dto/update-item.input-dto';
import { GLOBAL_PREFIX } from '../../../src/setup/global-prefix.setup';

export class BudgetItemsTestManager {
  private readonly httpServer: App;
  private sequence = 0;

  constructor(private readonly app: INestApplication) {
    this.httpServer = this.app.getHttpServer();
  }

  buildCreateItemDto(
    sectionId: number,
    overrides: Partial<Omit<CreateItemInputDto, 'sectionId'>> = {},
  ): CreateItemInputDto {
    this.sequence += 1;
    return {
      sectionId,
      name: overrides.name ?? `Item ${this.sequence}`,
      estimatedCost: overrides.estimatedCost,
      priority: overrides.priority,
    };
  }

  async createItem(
    dto: CreateItemInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
  ) {
    const response = await request(this.httpServer)
      .post(`/${GLOBAL_PREFIX}/budget/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async updateItem(
    id: number,
    dto: UpdateItemInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const response = await request(this.httpServer)
      .patch(`/${GLOBAL_PREFIX}/budget/items/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async deleteItem(
    id: number,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.httpServer)
      .delete(`/${GLOBAL_PREFIX}/budget/items/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return response.body;
  }
}