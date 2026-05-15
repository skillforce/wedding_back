import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CreateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/create-user-input-dto';
import { LoginInputDto } from '../../src/modules/user-accounts/api/input-dto/auth-input-dto';
import { CreatePlainUserInputDto } from '../../src/modules/user-accounts/api/input-dto/create-plain-user.input-dto';
import { UpdateProfileInputDto } from '../../src/modules/user-accounts/api/input-dto/update-profile.input-dto';

// Password used when activating plain users through the testing endpoint or confirming email in tests.
// Must be ≥ 10 chars (firstPasswordConstraints.minLength).
const PLAIN_USER_TEST_PASSWORD = 'testpassword1';

// CreatePlainUserInputDto has no password (SuperUser doesn't set it).
// Tests need a password to activate users via the testing endpoint and to log in afterward,
// so we carry it as a test-only field alongside the real DTO shape.
type PlainUserTestDto = CreatePlainUserInputDto & { password: string };

type BasicAuthCredentials = {
  username: string;
  password: string;
};

export class UserAccountsTestManager {
  private readonly httpServer: App;
  private sequence = 0;
  private readonly defaultBasicAuthCredentials: BasicAuthCredentials = {
    username: 'admin',
    password: 'qwerty',
  };

  constructor(private readonly app: INestApplication) {
    this.httpServer = this.app.getHttpServer();
  }

  buildCreateUserDto(
    overrides: Partial<CreateUserInputDto> = {},
  ): CreateUserInputDto {
    return {
      login: overrides.login ?? this.generateUniqueLogin(),
      password: overrides.password ?? 'pass123',
      ...(overrides.role !== undefined && { role: overrides.role }),
    };
  }

  buildCreatePlainUserDto(
    overrides: Partial<PlainUserTestDto> = {},
  ): PlainUserTestDto {
    return {
      login: overrides.login ?? this.generateUniqueLogin(),
      email: overrides.email ?? this.generateUniqueEmail(),
      password: overrides.password ?? PLAIN_USER_TEST_PASSWORD,
      ...(overrides.locale !== undefined && { locale: overrides.locale }),
    };
  }

  async createUser(
    dto: CreateUserInputDto,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
    basicAuthCredentials: BasicAuthCredentials = this
      .defaultBasicAuthCredentials,
  ) {
    const encodedCredentials = Buffer.from(
      `${basicAuthCredentials.username}:${basicAuthCredentials.password}`,
    ).toString('base64');

    const response = await request(this.httpServer)
      .post('/api/users')
      .set('Authorization', `Basic ${encodedCredentials}`)
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async createPlainUser(
    accessToken: string,
    dto: CreatePlainUserInputDto,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
  ) {
    const response = await request(this.httpServer)
      .post('/api/users/plain')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async createActivatedPlainUser(
    creatorUserId: number,
    dto: PlainUserTestDto,
    expectedStatus: HttpStatus = HttpStatus.CREATED,
  ) {
    const response = await request(this.httpServer)
      .post('/api/testing/users/plain')
      .send({ ...dto, creatorUserId })
      .expect(expectedStatus);

    return response.body;
  }

  async resendConfirmation(
    accessToken: string,
    userId: number,
    locale?: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    const url = `/api/users/${userId}/resend-confirmation${locale ? `?locale=${locale}` : ''}`;
    const response = await request(this.httpServer)
      .post(url)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return response.body;
  }

  async confirmEmail(
    token: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
    password: string = PLAIN_USER_TEST_PASSWORD,
  ) {
    const response = await request(this.httpServer)
      .post('/api/auth/confirm-email')
      .send({ token, password })
      .expect(expectedStatus);

    return response.body;
  }

  async login(
    dto: Partial<LoginInputDto> | { login: string; password?: string },
    expectedStatus: HttpStatus = HttpStatus.OK,
    deviceId?: string,
    userAgent?: string,
  ): Promise<{ body: any; refreshTokenCookie: string | undefined }> {
    const payload: Partial<LoginInputDto> =
      'login' in dto && !('loginOrEmail' in dto)
        ? { loginOrEmail: (dto as { login: string }).login, password: dto.password }
        : (dto as Partial<LoginInputDto>);
    const req = request(this.httpServer).post('/api/auth/login').send(payload);

    if (deviceId) {
      req.set('X-Device-Id', deviceId);
    }
    if (userAgent) {
      req.set('User-Agent', userAgent);
    }

    const response = await req.expect(expectedStatus);

    const setCookie = response.headers['set-cookie'];
    const cookieArray = Array.isArray(setCookie)
      ? setCookie
      : setCookie
        ? [setCookie]
        : [];
    const refreshTokenCookie = cookieArray.find((c) =>
      c.startsWith('refreshToken='),
    );

    return { body: response.body, refreshTokenCookie };
  }

  async refresh(
    refreshTokenCookie: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ): Promise<{ body: any; refreshTokenCookie: string | undefined }> {
    const response = await request(this.httpServer)
      .post('/api/auth/refresh')
      .set('Cookie', refreshTokenCookie)
      .expect(expectedStatus);

    const setCookie = response.headers['set-cookie'];
    const cookieArray = Array.isArray(setCookie)
      ? setCookie
      : setCookie
        ? [setCookie]
        : [];
    const newRefreshTokenCookie = cookieArray.find((c) =>
      c.startsWith('refreshToken='),
    );

    return { body: response.body, refreshTokenCookie: newRefreshTokenCookie };
  }

  async logout(
    refreshTokenCookie: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.httpServer)
      .post('/api/auth/logout')
      .set('Cookie', refreshTokenCookie)
      .expect(expectedStatus);

    return response.body;
  }

  async me(accessToken: string, expectedStatus: HttpStatus = HttpStatus.OK) {
    const response = await request(this.httpServer)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return response.body;
  }

  async deleteUserById(
    id: number,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.httpServer)
      .delete(`/api/users/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return response.body;
  }

  async getSessions(
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const response = await request(this.httpServer)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return response.body;
  }

  async revokeSession(
    accessToken: string,
    sessionId: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.httpServer)
      .delete(`/api/auth/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return response.body;
  }

  async revokeAllOtherSessions(
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.httpServer)
      .delete('/api/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(expectedStatus);

    return response.body;
  }

  async createUserAndLogin(
    overrides: Partial<CreateUserInputDto> = {},
    deviceId?: string,
  ): Promise<{
    credentials: CreateUserInputDto;
    userId: number;
    accessToken: string;
    refreshTokenCookie: string;
    deviceId: string;
  }> {
    const credentials = this.buildCreateUserDto(overrides);
    const createUserResponse = await this.createUser(credentials);
    const { body: loginBody, refreshTokenCookie } = await this.login(
      { loginOrEmail: credentials.login, password: credentials.password },
      HttpStatus.OK,
      deviceId,
    );

    return {
      credentials,
      userId: createUserResponse.id as number,
      accessToken: loginBody.accessToken as string,
      refreshTokenCookie: refreshTokenCookie!,
      deviceId: loginBody.deviceId as string,
    };
  }

  async updatePlainUserProfile(
    accessToken: string,
    userId: number,
    dto: UpdateProfileInputDto,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const response = await request(this.httpServer)
      .patch(`/api/users/${userId}/profile`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async forgotPassword(
    email: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.httpServer)
      .post('/api/auth/forgot-password')
      .send({ email })
      .expect(expectedStatus);

    return response.body;
  }

  async resetPassword(
    token: string,
    password: string,
    accessToken: string,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
  ) {
    const response = await request(this.httpServer)
      .post('/api/auth/reset-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ token, password })
      .expect(expectedStatus);

    return response.body;
  }

  extractTokenFromEmailHtml(html: string): string {
    const match = html.match(/token=([a-f0-9-]{36})/);
    if (!match) throw new Error('Token not found in email HTML');
    return match[1];
  }

  private generateUniqueLogin(): string {
    this.sequence += 1;
    return `u${Date.now().toString().slice(-6)}${this.sequence}`.slice(0, 10);
  }

  private generateUniqueEmail(): string {
    this.sequence += 1;
    return `test${Date.now()}${this.sequence}@example.com`;
  }
}
