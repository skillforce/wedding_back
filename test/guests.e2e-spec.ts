import { HttpStatus, INestApplication } from '@nestjs/common';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { initTesting } from './helpers/initTesting';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { GuestsTestManager } from './helpers/guests.test-manager';
import { getOptionsToken } from '@nestjs/throttler';

describe('GuestsController & GuestResponsesController (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;
  let guestsTestManager: GuestsTestManager;

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
    guestsTestManager = result.guestsTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // ─── Guests ────────────────────────────────────────────────────────────────

  describe('Guests', () => {
    it('should create a guest and return it in list', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const dto = guestsTestManager.buildCreateGuestDto(userId);
      const created = await guestsTestManager.createGuest(dto, accessToken);

      expect(created).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: dto.guest_name,
          is_already_answered: false,
        }),
      );

      const list = await guestsTestManager.getAllGuests(accessToken);
      expect(list).toEqual([
        expect.objectContaining({ id: created.id, name: dto.guest_name }),
      ]);
    });

    it('should get a guest by id', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const dto = guestsTestManager.buildCreateGuestDto(userId);
      const created = await guestsTestManager.createGuest(dto, accessToken);

      const found = await guestsTestManager.getGuestById(created.id);
      expect(found).toEqual(
        expect.objectContaining({
          id: created.id,
          name: dto.guest_name,
          is_already_answered: false,
          response: null,
        }),
      );
    });

    it('should return 404 when getting guest by non-existing id', async () => {
      await guestsTestManager.getGuestById(
        '00000000-0000-0000-0000-000000000000',
        HttpStatus.NOT_FOUND,
      );
    });

    it('should create and delete a guest', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const dto = guestsTestManager.buildCreateGuestDto(userId);
      const created = await guestsTestManager.createGuest(dto, accessToken);

      await guestsTestManager.deleteGuestById(created.id, accessToken);

      const list = await guestsTestManager.getAllGuests(accessToken);
      expect(list).toEqual([]);
    });

    it('should reject duplicate guest name for same user', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const dto = guestsTestManager.buildCreateGuestDto(userId);
      await guestsTestManager.createGuest(dto, accessToken);

      await guestsTestManager.createGuest(
        dto,
        accessToken,
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should not return guests of another user', async () => {
      const { userId: userId1, accessToken: token1 } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: token2 } =
        await userAccountsTestManager.createUserAndLogin();

      const dto = guestsTestManager.buildCreateGuestDto(userId1);
      await guestsTestManager.createGuest(dto, token1);

      const list = await guestsTestManager.getAllGuests(token2);
      expect(list).toEqual([]);
    });

    it('should return 401 when accessing guests without token', async () => {
      await guestsTestManager.getAllGuests(
        'invalid-token',
        HttpStatus.UNAUTHORIZED,
      );
    });
  });

  // ─── Guest Responses ───────────────────────────────────────────────────────

  describe('Guest Responses', () => {
    it('should submit a response for an existing guest', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );

      const responseDto = guestsTestManager.buildCreateGuestResponseDto({
        preferred_drinks: ['wine', 'juice'],
        plus_one: false,
      });

      await guestsTestManager.createGuestResponse(guest.id, responseDto);

      const updated = await guestsTestManager.getGuestById(guest.id);
      expect(updated.is_already_answered).toBe(true);
      expect(updated.response).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          preferred_drinks: ['wine', 'juice'],
          plus_one: false,
          plus_one_name: null,
          other_preferences: null,
        }),
      );
    });

    it('should return 404 when submitting response for non-existing guest', async () => {
      const responseDto = guestsTestManager.buildCreateGuestResponseDto();

      await guestsTestManager.createGuestResponse(
        '00000000-0000-0000-0000-000000000000',
        responseDto,
        HttpStatus.NOT_FOUND,
      );
    });

    it('should return 400 when submitting duplicate response for same guest', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );

      const responseDto = guestsTestManager.buildCreateGuestResponseDto();
      await guestsTestManager.createGuestResponse(guest.id, responseDto);
      await guestsTestManager.createGuestResponse(
        guest.id,
        responseDto,
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should require plus_one_name when plus_one is true', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );

      const responseDto = guestsTestManager.buildCreateGuestResponseDto({
        plus_one: true,
        plus_one_name: undefined,
      });

      await guestsTestManager.createGuestResponse(
        guest.id,
        responseDto,
        HttpStatus.BAD_REQUEST,
      );
    });

    it('should submit response with plus_one and plus_one_name', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );

      const responseDto = guestsTestManager.buildCreateGuestResponseDto({
        plus_one: true,
        plus_one_name: 'Jane Doe',
      });

      await guestsTestManager.createGuestResponse(guest.id, responseDto);

      const updated = await guestsTestManager.getGuestById(guest.id);
      expect(updated.is_already_answered).toBe(true);
    });

    it('should allow owner to delete a guest response', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );

      await guestsTestManager.createGuestResponse(
        guest.id,
        guestsTestManager.buildCreateGuestResponseDto(),
      );

      await guestsTestManager.deleteGuestResponse(guest.id, accessToken);

      const updated = await guestsTestManager.getGuestById(guest.id);
      expect(updated.is_already_answered).toBe(false);
      expect(updated.response).toBeNull();
    });

    it('should return 401 when deleting response without token', async () => {
      await guestsTestManager.deleteGuestResponse(
        '00000000-0000-0000-0000-000000000000',
        '',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it("should return 403 when deleting response belonging to another user's guest", async () => {
      const { userId: userId1, accessToken: token1 } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: token2 } =
        await userAccountsTestManager.createUserAndLogin();

      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId1),
        token1,
      );

      await guestsTestManager.createGuestResponse(
        guest.id,
        guestsTestManager.buildCreateGuestResponseDto(),
      );

      await guestsTestManager.deleteGuestResponse(
        guest.id,
        token2,
        HttpStatus.FORBIDDEN,
      );
    });

    it('should return 404 when deleting response for guest with no response', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );

      await guestsTestManager.deleteGuestResponse(
        guest.id,
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });
  });
});
