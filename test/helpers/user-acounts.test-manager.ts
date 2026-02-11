import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { CreateUserInputDto } from '../../src/modules/user-accounts/api/input-dto/create-user-input-dto';
import { LoginInputDto } from '../../src/modules/user-accounts/api/input-dto/auth-input-dto';

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

  async login(
    dto: Partial<LoginInputDto>,
    expectedStatus: HttpStatus = HttpStatus.OK,
  ) {
    const response = await request(this.httpServer)
      .post('/api/auth/login')
      .send(dto)
      .expect(expectedStatus);

    return response.body;
  }

  async deleteUserById(
    id: number,
    expectedStatus: HttpStatus = HttpStatus.NO_CONTENT,
    basicAuthCredentials: BasicAuthCredentials = this
      .defaultBasicAuthCredentials,
  ) {
    const encodedCredentials = Buffer.from(
      `${basicAuthCredentials.username}:${basicAuthCredentials.password}`,
    ).toString('base64');

    const response = await request(this.httpServer)
      .delete(`/api/users/${id}`)
      .set('Authorization', `Basic ${encodedCredentials}`)
      .expect(expectedStatus);

    return response.body;
  }

  async createUserAndLogin(
    overrides: Partial<CreateUserInputDto> = {},
  ): Promise<{
    credentials: CreateUserInputDto;
    userId: number;
    accessToken: string;
  }> {
    const credentials = this.buildCreateUserDto(overrides);
    const createUserResponse = await this.createUser(credentials);
    const loginResponse = await this.login(credentials);

    return {
      credentials,
      userId: createUserResponse.id as number,
      accessToken: loginResponse.accessToken as string,
    };
  }

  private generateUniqueLogin(): string {
    this.sequence += 1;
    return `u${Date.now().toString().slice(-6)}${this.sequence}`.slice(0, 10);
  }
}
