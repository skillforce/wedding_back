import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CreateSeatingSeatInputDto } from '../../src/modules/seating-arrangements/api/input-dto/create-seating-seat.input-dto';
import { GLOBAL_PREFIX } from '../../src/setup/global-prefix.setup';

export class SeatingSeatsTestManager {
  private readonly httpServer: App;

  constructor(private readonly app: INestApplication) {
    this.httpServer = this.app.getHttpServer();
  }

  buildCreateSeatDto(guestId: string): CreateSeatingSeatInputDto {
    return { guest_id: guestId };
  }

  async createSeat(
    tableId: string,
    dto: CreateSeatingSeatInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .post(`/${GLOBAL_PREFIX}/seating-arrangements/tables/${tableId}/seats`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async deleteSeat(
    tableId: string,
    seatId: string,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .delete(`/${GLOBAL_PREFIX}/seating-arrangements/tables/${tableId}/seats/${seatId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }
}