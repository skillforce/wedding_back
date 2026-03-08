import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CreateSeatingTableInputDto } from '../../src/modules/seating-arrangements/api/input-dto/create-seating-table.input-dto';
import { UpdateSeatingTableInputDto } from '../../src/modules/seating-arrangements/api/input-dto/update-seating-table.input-dto';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';

export class SeatingTablesTestManager {
  private readonly httpServer: App;
  private sequence = 0;

  constructor(private readonly app: INestApplication) {
    this.httpServer = this.app.getHttpServer();
  }

  buildCreateTableDto(
    overrides: Partial<CreateSeatingTableInputDto> = {},
  ): CreateSeatingTableInputDto {
    this.sequence += 1;
    return {
      name: overrides.name ?? `Table ${this.sequence}`,
      position: overrides.position ?? { x: this.sequence * 10, y: this.sequence * 10 },
      shape: overrides.shape,
      rotation: overrides.rotation,
      radius: overrides.radius,
    };
  }

  async createTable(
    dto: CreateSeatingTableInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
  ) {
    const response = await request(this.httpServer)
      .post(`/${GLOBAL_PREFIX}/seating-arrangements/tables`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async getAllTables(
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const response = await request(this.httpServer)
      .get(`/${GLOBAL_PREFIX}/seating-arrangements/tables`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return response.body;
  }

  async updateTable(
    id: string,
    dto: Partial<UpdateSeatingTableInputDto>,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const response = await request(this.httpServer)
      .put(`/${GLOBAL_PREFIX}/seating-arrangements/tables/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async deleteTable(
    id: string,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.httpServer)
      .delete(`/${GLOBAL_PREFIX}/seating-arrangements/tables/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return response.body;
  }
}