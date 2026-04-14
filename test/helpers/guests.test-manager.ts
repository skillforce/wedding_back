import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CreateGuestInputDto, GuestCoupleStatusInputDto, GuestFormInputDto } from '../../src/modules/guests/api/input-dto/guest.input-dto';
import { RelationshipToCouple } from '../../src/modules/guests/domain/enteties/guest-form.entity';
import { CreateGuestResponseInputDto } from '../../src/modules/guests/api/input-dto/guest-response.input-dto';
import { UpdateGuestFormInputDto } from '../../src/modules/guests/api/input-dto/update-guest-form.input-dto';
import { GuestDetailViewDto } from '../../src/modules/guests/api/view-dto/guest-detail.view-dto';

export class GuestsTestManager {
  private readonly httpServer: App;
  private sequence = 0;

  constructor(private readonly app: INestApplication) {
    this.httpServer = this.app.getHttpServer();
  }

  buildGuestFormDto(overrides: Partial<GuestFormInputDto> = {}): GuestFormInputDto {
    return {
      relationship_to_couple: overrides.relationship_to_couple ?? RelationshipToCouple.BrideSide,
      age_group: overrides.age_group ?? 'adult',
      has_kids_attending: overrides.has_kids_attending ?? false,
      amount_of_kids: overrides.amount_of_kids ?? null,
      personality_type: overrides.personality_type ?? 'introvert',
      vip_parents: overrides.vip_parents ?? false,
      vip_grandparents: overrides.vip_grandparents ?? false,
      vip_relatives: overrides.vip_relatives ?? false,
      ifWithCouple: overrides.ifWithCouple,
    };
  }

  buildGuestCoupleStatusDto(overrides: Partial<GuestCoupleStatusInputDto> = {}): GuestCoupleStatusInputDto {
    return {
      response: overrides.response ?? false,
      coupleId: overrides.coupleId,
    };
  }

  buildCreateGuestDto(
    userId: number,
    overrides: Partial<CreateGuestInputDto> = {},
  ): CreateGuestInputDto {
    return {
      guest_name: overrides.guest_name ?? this.generateUniqueGuestName(),
      user_id: userId,
      guestForm: overrides.guestForm,
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
    userId?: number,
  ): Promise<GuestDetailViewDto[]> {
    const req = request(this.httpServer)
      .post('/api/guests/')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
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
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .get('/api/guests/')
      .set('Authorization', `Bearer ${accessToken}`);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async deleteGuestById(
    id: string,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .delete(`/api/guests/${id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  async updateGuestForm(
    guestId: string,
    dto: UpdateGuestFormInputDto,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
    userId?: number,
  ): Promise<GuestDetailViewDto[]> {
    const req = request(this.httpServer)
      .patch(`/api/guests/${guestId}/form`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
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
    userId?: number,
  ) {
    const req = request(this.httpServer)
      .delete(`/api/guests/${guestId}/response`)
      .set('Authorization', `Bearer ${accessToken}`);

    if (userId !== undefined) req.query({ userId });

    const response = await req.expect(expectedStatus);
    return response.body;
  }

  private generateUniqueGuestName(): string {
    this.sequence += 1;
    return `guest-${Date.now().toString().slice(-6)}-${this.sequence}`.slice(0, 20);
  }
}