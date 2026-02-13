import { HttpStatus, INestApplication } from '@nestjs/common';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { initTesting } from './helpers/initTesting';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { GuestsTestManager } from './helpers/guests.test-manager';

describe('AuthController & GuestsController (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;
  let guestsTestManager: GuestsTestManager;

  beforeAll(async () => {
    const result = await initTesting((moduleBuilder) =>
      moduleBuilder
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
    guestsTestManager = result.guestsTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
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

  it('should create list and delete guest', async () => {
    const { userId, accessToken } =
      await userAccountsTestManager.createUserAndLogin();
    const createGuestDto = guestsTestManager.buildCreateGuestDto(userId, {
      preferred_drinks: ['tea', 'coffee'],
      other_preferences: 'window seat',
    });

    const createGuestResponse = await guestsTestManager.createGuest(
      createGuestDto,
      accessToken,
    );

    const guestId = createGuestResponse.id;
    expect(guestId).toEqual(expect.any(Number));

    const getGuestsResponse = await guestsTestManager.getAllGuests(accessToken);
    expect(getGuestsResponse).toEqual([
      expect.objectContaining({
        id: guestId,
        name: createGuestDto.guest_name,
        preferred_drinks: createGuestDto.preferred_drinks,
        other_preferences: createGuestDto.other_preferences,
      }),
    ]);

    await guestsTestManager.deleteGuestById(guestId, accessToken);
    const guestsAfterDelete = await guestsTestManager.getAllGuests(accessToken);
    expect(guestsAfterDelete).toEqual([]);
  });

  it('should reject duplicate guest name for same user', async () => {
    const { userId, accessToken } =
      await userAccountsTestManager.createUserAndLogin();
    const createGuestDto = guestsTestManager.buildCreateGuestDto(userId);

    await guestsTestManager.createGuest(createGuestDto, accessToken);
    await guestsTestManager.createGuest(
      createGuestDto,
      accessToken,
      HttpStatus.BAD_REQUEST,
    );
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
