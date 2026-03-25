import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CreateBudgetSectionItemInputDto } from '../../../src/modules/budget/api/input-dto/create-budget-section-item-input.dto';
import { UpdateBudgetSectionItemInputDto } from '../../../src/modules/budget/api/input-dto/update-budget-section-item-input.dto';
import { BaseCurrency } from '../../../src/modules/currency/domain/entities/base-currency.enum';
import { MoveBudgetItemInputDto } from '../../../src/modules/budget/api/input-dto/move-budget-item.input-dto';
import { GLOBAL_PREFIX } from '../../../src/setup/global-prefix.setup';

export class BudgetItemsTestManager {
  private readonly httpServer: App;
  private sequence = 0;

  constructor(private readonly app: INestApplication) {
    this.httpServer = this.app.getHttpServer();
  }

  buildCreateItemDto(
    sectionId: number,
    overrides: Partial<Omit<CreateBudgetSectionItemInputDto, 'sectionId'>> = {},
  ): CreateBudgetSectionItemInputDto {
    this.sequence += 1;
    return {
      sectionId,
      name: overrides.name ?? `Item ${this.sequence}`,
      estimatedCost: overrides.estimatedCost,
      priority: overrides.priority,
      currency: overrides.currency ?? BaseCurrency.USD,
    };
  }

  async createItem(
    dto: Omit<CreateBudgetSectionItemInputDto, 'currency'>,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
  ) {
    const payload = { ...dto, currency: BaseCurrency.USD };
    const response = await request(this.httpServer)
      .post(`/${GLOBAL_PREFIX}/budget/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(expectedStatus);

    return response.body;
  }

  async updateItem(
    id: number,
    dto: UpdateBudgetSectionItemInputDto,
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

  async moveItem(
    dto: MoveBudgetItemInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const response = await request(this.httpServer)
      .patch(`/${GLOBAL_PREFIX}/budget/items/move`)
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
