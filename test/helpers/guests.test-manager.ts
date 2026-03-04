import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CreateGuestInputDto } from '../../src/modules/guests/api/input-dto/guest.input-dto';
import { CreateGuestResponseInputDto } from '../../src/modules/guests/api/input-dto/guest-response.input-dto';

export class GuestsTestManager {
  private readonly httpServer: App;
  private sequence = 0;

  constructor(private readonly app: INestApplication) {
    this.httpServer = this.app.getHttpServer();
  }

  buildCreateGuestDto(
    userId: number,
    overrides: Partial<CreateGuestInputDto> = {},
  ): CreateGuestInputDto {
    return {
      guest_name: overrides.guest_name ?? this.generateUniqueGuestName(),
      user_id: userId,
    };
  }

  buildCreateGuestResponseDto(
    overrides: Partial<CreateGuestResponseInputDto> = {},
  ): CreateGuestResponseInputDto {
    return {
      preferred_drinks: overrides.preferred_drinks ?? ['water'],
      other_preferences: overrides.other_preferences,
      plus_one: overrides.plus_one ?? false,
      plus_one_name: overrides.plus_one_name,
    };
  }

  async createGuest(
    dto: CreateGuestInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
  ) {
    const response = await request(this.httpServer)
      .post('/api/guests/')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async getGuestById(
    id: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const response = await request(this.httpServer)
      .get(`/api/guests/${id}`)
      .expect(expectedStatus);

    return response.body;
  }

  async getAllGuests(
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const response = await request(this.httpServer)
      .get('/api/guests/')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return response.body;
  }

  async deleteGuestById(
    id: string,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.httpServer)
      .delete(`/api/guests/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);
    return response.body;
  }

  async createGuestResponse(
    guestId: string,
    dto: CreateGuestResponseInputDto,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
  ) {
    const response = await request(this.httpServer)
      .post(`/api/guests/${guestId}/response`)
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async deleteGuestResponse(
    guestId: string,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.httpServer)
      .delete(`/api/guests/${guestId}/response`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return response.body;
  }

  private generateUniqueGuestName(): string {
    this.sequence += 1;
    return `guest-${Date.now().toString().slice(-6)}-${this.sequence}`.slice(
      0,
      20,
    );
  }
}
