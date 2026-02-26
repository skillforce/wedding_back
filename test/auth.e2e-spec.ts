import { HttpStatus, INestApplication } from '@nestjs/common';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { initTesting } from './helpers/initTesting';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { getOptionsToken } from '@nestjs/throttler';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;

  beforeAll(async () => {
    const result = await initTesting((moduleBuilder) =>
      moduleBuilder
        .overrideProvider(getOptionsToken())
        .useValue([{ ttl: 10000, limit: 9999 }])
        .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
        .useFactory({
          factory: (userAccountsConfig: UserAccountsConfig) => {
            return new JwtService({
              secret: userAccountsConfig.accessTokenSecret,
              signOptions: {
                expiresIn: userAccountsConfig.accessTokenExpireIn,
              },
            });
          },
          inject: [UserAccountsConfig],
        }),
    );
    app = result.app;
    userAccountsTestManager = result.userAccountsTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should create user and login', async () => {
    const credentials = userAccountsTestManager.buildCreateUserDto();

    const createUserResponse =
      await userAccountsTestManager.createUser(credentials);
    expect(createUserResponse).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        login: credentials.login,
      }),
    );

    const loginResponse = await userAccountsTestManager.login(credentials);
    expect(loginResponse).toEqual({
      accessToken: expect.any(String),
    });
  });

  it('should return current user in me request', async () => {
    const { credentials, userId, accessToken } =
      await userAccountsTestManager.createUserAndLogin();

    const meResponse = await userAccountsTestManager.me(accessToken);

    expect(meResponse).toEqual({
      id: userId,
      login: credentials.login,
    });
  });

  it('should reject duplicate user login', async () => {
    const credentials = userAccountsTestManager.buildCreateUserDto();

    await userAccountsTestManager.createUser(credentials);

    const duplicateResponse = await userAccountsTestManager.createUser(
      credentials,
      HttpStatus.BAD_REQUEST,
    );
    expect(duplicateResponse).toEqual({
      errorsMessages: [
        {
          field: 'login',
          message: 'user with this login already exists',
        },
      ],
    });
  });

  it('should reject login with invalid password', async () => {
    const credentials = userAccountsTestManager.buildCreateUserDto();
    await userAccountsTestManager.createUser(credentials);

    const loginResponse = await userAccountsTestManager.login(
      {
        login: credentials.login,
        password: 'wrong-pass',
      },
      HttpStatus.UNAUTHORIZED,
    );

    expect(loginResponse).toEqual({
      errorsMessages: [
        {
          field: 'login',
          message: 'Invalid login or password',
        },
        {
          field: 'password',
          message: 'Invalid login or password',
        },
      ],
    });
  });

  it('should delete user and reject next login', async () => {
    const credentials = userAccountsTestManager.buildCreateUserDto();
    const createUserResponse =
      await userAccountsTestManager.createUser(credentials);

    await userAccountsTestManager.deleteUserById(
      createUserResponse.id as number,
    );

    await userAccountsTestManager.login(credentials, HttpStatus.UNAUTHORIZED);
  });
});