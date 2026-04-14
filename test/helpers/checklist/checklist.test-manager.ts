import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { GLOBAL_PREFIX } from '../../../src/setup/global-prefix.setup';
import { CreatePhaseInputDto } from '../../../src/modules/checklist/api/input-dto/create-phase.input-dto';
import { UpdatePhaseInputDto } from '../../../src/modules/checklist/api/input-dto/update-phase.input-dto';
import { CreateChecklistPhaseItemInputDto } from '../../../src/modules/checklist/api/input-dto/create-checklist-phase-item-input.dto';
import { UpdateChecklistPhaseItemInputDto } from '../../../src/modules/checklist/api/input-dto/update-checklist-phase-item-input.dto';
import { MoveItemInputDto } from '../../../src/modules/checklist/api/input-dto/move-item.input-dto';
import { ChecklistItemPriority } from '../../../src/modules/checklist/domain/entities/checklist-item.entity';
import { ChecklistLocale } from '../../../src/modules/checklist/app/usecases/default-checklist-phases';

export class ChecklistTestManager {
  private readonly httpServer: App;
  private sequence = 0;

  constructor(private readonly app: INestApplication) {
    this.httpServer = this.app.getHttpServer();
  }

  buildCreatePhaseDto(
    overrides: Partial<CreatePhaseInputDto> = {},
  ): CreatePhaseInputDto {
    this.sequence += 1;

    return {
      name: overrides.name ?? `Phase ${this.sequence}`,
      timeline: overrides.timeline ?? `Timeline ${this.sequence}`,
      icon: overrides.icon ?? null,
    };
  }

  buildUpdatePhaseDto(
    overrides: Partial<UpdatePhaseInputDto> = {},
  ): UpdatePhaseInputDto {
    return {
      name: overrides.name,
      timeline: overrides.timeline,
      icon: overrides.icon,
    };
  }

  buildCreateItemDto(
    overrides: Partial<CreateChecklistPhaseItemInputDto> = {},
  ): CreateChecklistPhaseItemInputDto {
    this.sequence += 1;

    return {
      title: overrides.title ?? `Item ${this.sequence}`,
      note: overrides.note,
      priority: overrides.priority ?? ChecklistItemPriority.Normal,
    };
  }

  buildUpdateItemDto(
    overrides: Partial<UpdateChecklistPhaseItemInputDto> = {},
  ): UpdateChecklistPhaseItemInputDto {
    return {
      title: overrides.title,
      note: overrides.note,
      comment: overrides.comment,
      completed: overrides.completed,
      priority: overrides.priority,
    };
  }

  async getChecklist(
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
    locale?: ChecklistLocale,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .get(`/${GLOBAL_PREFIX}/checklist`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (locale) req.query({ locale });
    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async resetChecklist(
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
    locale?: ChecklistLocale,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .post(`/${GLOBAL_PREFIX}/checklist/reset`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (locale) req.query({ locale });
    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async createPhase(
    dto: CreatePhaseInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .post(`/${GLOBAL_PREFIX}/checklist/phases`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async updatePhase(
    phaseId: string,
    dto: UpdatePhaseInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .patch(`/${GLOBAL_PREFIX}/checklist/phases/${phaseId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async deletePhase(
    phaseId: string,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .delete(`/${GLOBAL_PREFIX}/checklist/phases/${phaseId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async createItem(
    phaseId: string,
    dto: CreateChecklistPhaseItemInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .post(`/${GLOBAL_PREFIX}/checklist/phases/${phaseId}/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async updateItem(
    phaseId: string,
    itemId: string,
    dto: UpdateChecklistPhaseItemInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .patch(`/${GLOBAL_PREFIX}/checklist/phases/${phaseId}/items/${itemId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async toggleItem(
    phaseId: string,
    itemId: string,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .patch(`/${GLOBAL_PREFIX}/checklist/phases/${phaseId}/items/${itemId}/toggle`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async deleteItem(
    phaseId: string,
    itemId: string,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .delete(`/${GLOBAL_PREFIX}/checklist/phases/${phaseId}/items/${itemId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async moveItem(
    dto: MoveItemInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .patch(`/${GLOBAL_PREFIX}/checklist/items/move`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }
}