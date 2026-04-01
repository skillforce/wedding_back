import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { UpdateProfileInputDto } from '../../src/modules/user-accounts/api/input-dto/update-profile.input-dto';
import * as fs from 'fs';
import * as path from 'path';

export const FAKE_JPEG_BUFFER = fs.readFileSync(
  path.join(__dirname, '../fixtures/mock_for_test.png'),
);

export class ProfileTestManager {
  private readonly httpServer: App;

  constructor(private readonly app: INestApplication) {
    this.httpServer = this.app.getHttpServer();
  }

  async updateProfile(
    accessToken: string,
    dto: UpdateProfileInputDto,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const response = await request(this.httpServer)
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async uploadProfileImage(
    accessToken: string,
    fileBuffer: Buffer,
    mimeType: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const response = await request(this.httpServer)
      .patch('/api/users/profile/image')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', fileBuffer, {
        filename: 'avatar.png',
        contentType: mimeType,
      })
      .expect(expectedStatus);

    return response.body;
  }
}
