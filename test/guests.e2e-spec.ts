import { HttpStatus, INestApplication } from '@nestjs/common';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { initTesting } from './helpers/initTesting';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { GuestsTestManager } from './helpers/guests.test-manager';
import { getOptionsToken } from '@nestjs/throttler';
import { GuestDetailViewDto } from '../src/modules/guests/api/view-dto/guest-detail.view-dto';
import { UserRole } from '../src/modules/user-accounts/domain/entities/user-role.enum';

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

  function findById(
    affected: GuestDetailViewDto[],
    id: string,
  ): GuestDetailViewDto {
    return affected.find((g) => g.id === id)!;
  }

  describe('Guests', () => {
    it('should create a guest without guestForm and return null guestForm', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const dto = guestsTestManager.buildCreateGuestDto(userId);
      const affected = await guestsTestManager.createGuest(dto, accessToken);
      const created = affected[0];

      expect(created).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: dto.guest_name,
          is_already_answered: false,
          guestForm: null,
          response: null,
        }),
      );
    });

    it('should create a guest with guestForm and return it', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guestForm = guestsTestManager.buildGuestFormDto();
      const dto = guestsTestManager.buildCreateGuestDto(userId, { guestForm });
      const affected = await guestsTestManager.createGuest(dto, accessToken);
      const created = affected[0];

      expect(created).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: dto.guest_name,
          is_already_answered: false,
          guestForm: expect.objectContaining({
            relationship_to_couple: guestForm.relationship_to_couple,
            age_group: guestForm.age_group,
            has_kids_attending: guestForm.has_kids_attending,
            amount_of_kids: guestForm.amount_of_kids,
            personality_type: guestForm.personality_type,
            vip_parents: guestForm.vip_parents,
            vip_grandparents: guestForm.vip_grandparents,
            vip_relatives: guestForm.vip_relatives,
          }),
          response: null,
        }),
      );
    });

    it('should return guestForm in list', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guestForm = guestsTestManager.buildGuestFormDto({
        age_group: 'young',
      });
      const dto = guestsTestManager.buildCreateGuestDto(userId, { guestForm });
      const affected = await guestsTestManager.createGuest(dto, accessToken);
      const created = affected[0];

      const list = await guestsTestManager.getAllGuests(accessToken);
      expect(list).toEqual([
        expect.objectContaining({
          id: created.id,
          name: dto.guest_name,
          is_already_answered: false,
          guestForm: expect.objectContaining({ age_group: 'young' }),
          response: null,
        }),
      ]);
    });

    it('should get a guest by id', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const dto = guestsTestManager.buildCreateGuestDto(userId);
      const affected = await guestsTestManager.createGuest(dto, accessToken);
      const created = affected[0];

      const found = await guestsTestManager.getGuestById(created.id);
      expect(found).toEqual(
        expect.objectContaining({
          id: created.id,
          name: dto.guest_name,
          is_already_answered: false,
          guestForm: null,
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
      const affected = await guestsTestManager.createGuest(dto, accessToken);
      const created = affected[0];

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

  // ─── Guest Forms ───────────────────────────────────────────────────────────

  describe('Guest Forms', () => {
    it('should update guest form and return updated guest', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guestForm = guestsTestManager.buildGuestFormDto();
      const dto = guestsTestManager.buildCreateGuestDto(userId, { guestForm });
      const created = (
        await guestsTestManager.createGuest(dto, accessToken)
      )[0];

      const affected = await guestsTestManager.updateGuestForm(
        created.id,
        { age_group: 'old', vip_relatives: true },
        accessToken,
      );
      const updated = findById(affected, created.id);

      expect(updated.guestForm).toEqual(
        expect.objectContaining({
          age_group: 'old',
          vip_relatives: true,
          relationship_to_couple: guestForm.relationship_to_couple,
          personality_type: guestForm.personality_type,
        }),
      );
    });

    it('should preserve omitted fields on partial update', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guestForm = guestsTestManager.buildGuestFormDto({
        personality_type: 'extrovert',
        vip_parents: true,
      });
      const dto = guestsTestManager.buildCreateGuestDto(userId, { guestForm });
      const created = (
        await guestsTestManager.createGuest(dto, accessToken)
      )[0];

      await guestsTestManager.updateGuestForm(
        created.id,
        { age_group: 'child' },
        accessToken,
      );

      const found = await guestsTestManager.getGuestById(created.id);
      expect(found.guestForm).toEqual(
        expect.objectContaining({
          age_group: 'child',
          personality_type: 'extrovert',
          vip_parents: true,
        }),
      );
    });

    it('should return 404 when updating form for guest with no form', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const dto = guestsTestManager.buildCreateGuestDto(userId);
      const created = (
        await guestsTestManager.createGuest(dto, accessToken)
      )[0];

      await guestsTestManager.updateGuestForm(
        created.id,
        { age_group: 'young' },
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it('should return 404 when updating form for non-existing guest', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await guestsTestManager.updateGuestForm(
        '00000000-0000-0000-0000-000000000000',
        { age_group: 'young' },
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it('should return 403 when updating form belonging to another user', async () => {
      const { userId: userId1, accessToken: token1 } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: token2 } =
        await userAccountsTestManager.createUserAndLogin();

      const guestForm = guestsTestManager.buildGuestFormDto();
      const dto = guestsTestManager.buildCreateGuestDto(userId1, { guestForm });
      const created = (await guestsTestManager.createGuest(dto, token1))[0];

      await guestsTestManager.updateGuestForm(
        created.id,
        { age_group: 'young' },
        token2,
        HttpStatus.FORBIDDEN,
      );
    });

    it('should return 401 when updating form without token', async () => {
      await guestsTestManager.updateGuestForm(
        '00000000-0000-0000-0000-000000000000',
        { age_group: 'young' },
        '',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should create guest with ifWithCouple response false and return it', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guestForm = guestsTestManager.buildGuestFormDto({
        ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({
          response: false,
        }),
      });
      const dto = guestsTestManager.buildCreateGuestDto(userId, { guestForm });
      const created = (
        await guestsTestManager.createGuest(dto, accessToken)
      )[0];

      expect(created.guestForm?.ifWithCouple).toEqual({ response: false });
    });

    it('should create guest with ifWithCouple response true and no coupleId', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guestForm = guestsTestManager.buildGuestFormDto({
        ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({
          response: true,
        }),
      });
      const dto = guestsTestManager.buildCreateGuestDto(userId, { guestForm });
      const created = (
        await guestsTestManager.createGuest(dto, accessToken)
      )[0];

      expect(created.guestForm?.ifWithCouple).toEqual({ response: true });
    });

    it('should create guest with ifWithCouple coupleId and return only primary when partner has no form', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const partner = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId),
          accessToken,
        )
      )[0];

      const guestForm = guestsTestManager.buildGuestFormDto({
        ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({
          response: true,
          coupleId: partner.id,
        }),
      });
      const dto = guestsTestManager.buildCreateGuestDto(userId, { guestForm });
      const affected = await guestsTestManager.createGuest(dto, accessToken);
      const created = findById(
        affected,
        affected.find((g) => g.name === dto.guest_name)!.id,
      );

      expect(affected).toHaveLength(1);
      expect(created.guestForm?.ifWithCouple).toEqual({
        response: true,
        coupleId: partner.id,
      });
    });

    it('should create guest with coupleId and sync partner form when partner has a form', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const partnerForm = guestsTestManager.buildGuestFormDto();
      const partnerDto = guestsTestManager.buildCreateGuestDto(userId, {
        guestForm: partnerForm,
      });
      const partner = (
        await guestsTestManager.createGuest(partnerDto, accessToken)
      )[0];

      const guestForm = guestsTestManager.buildGuestFormDto({
        ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({
          response: true,
          coupleId: partner.id,
        }),
      });
      const dto = guestsTestManager.buildCreateGuestDto(userId, { guestForm });
      const affected = await guestsTestManager.createGuest(dto, accessToken);

      expect(affected).toHaveLength(2);

      const createdGuest = affected.find((g) => g.name === dto.guest_name)!;
      const updatedPartner = findById(affected, partner.id);

      expect(createdGuest.guestForm?.ifWithCouple).toEqual({
        response: true,
        coupleId: partner.id,
      });
      expect(updatedPartner.guestForm?.ifWithCouple).toEqual({
        response: true,
        coupleId: createdGuest.id,
      });
    });

    it('should return 409 when assigning coupleId to a guest already linked to another', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const partnerForm = guestsTestManager.buildGuestFormDto();
      const partnerDto = guestsTestManager.buildCreateGuestDto(userId, {
        guestForm: partnerForm,
      });
      const partner = (
        await guestsTestManager.createGuest(partnerDto, accessToken)
      )[0];

      const occupierForm = guestsTestManager.buildGuestFormDto({
        ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({
          response: true,
          coupleId: partner.id,
        }),
      });
      const occupierDto = guestsTestManager.buildCreateGuestDto(userId, {
        guestForm: occupierForm,
      });
      await guestsTestManager.createGuest(occupierDto, accessToken);

      const intruderForm = guestsTestManager.buildGuestFormDto({
        ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({
          response: true,
          coupleId: partner.id,
        }),
      });
      const intruderDto = guestsTestManager.buildCreateGuestDto(userId, {
        guestForm: intruderForm,
      });
      await guestsTestManager.createGuest(
        intruderDto,
        accessToken,
        HttpStatus.CONFLICT,
      );
    });

    it('should update ifWithCouple field via PATCH form and return only primary when partner has no form', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guestForm = guestsTestManager.buildGuestFormDto({
        ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({
          response: false,
        }),
      });
      const dto = guestsTestManager.buildCreateGuestDto(userId, { guestForm });
      const created = (
        await guestsTestManager.createGuest(dto, accessToken)
      )[0];

      const partner = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId),
          accessToken,
        )
      )[0];

      const affected = await guestsTestManager.updateGuestForm(
        created.id,
        { ifWithCouple: { response: true, coupleId: partner.id } },
        accessToken,
      );

      expect(affected).toHaveLength(1);
      const updated = findById(affected, created.id);
      expect(updated.guestForm?.ifWithCouple).toEqual({
        response: true,
        coupleId: partner.id,
      });
    });

    it('should update ifWithCouple via PATCH and sync partner form when partner has a form', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guestForm = guestsTestManager.buildGuestFormDto({
        ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({
          response: false,
        }),
      });
      const created = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId, { guestForm }),
          accessToken,
        )
      )[0];

      const partnerForm = guestsTestManager.buildGuestFormDto();
      const partner = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId, {
            guestForm: partnerForm,
          }),
          accessToken,
        )
      )[0];

      const affected = await guestsTestManager.updateGuestForm(
        created.id,
        { ifWithCouple: { response: true, coupleId: partner.id } },
        accessToken,
      );

      expect(affected).toHaveLength(2);
      const updatedGuest = findById(affected, created.id);
      const updatedPartner = findById(affected, partner.id);

      expect(updatedGuest.guestForm?.ifWithCouple).toEqual({
        response: true,
        coupleId: partner.id,
      });
      expect(updatedPartner.guestForm?.ifWithCouple).toEqual({
        response: true,
        coupleId: created.id,
      });
    });

    it('should unlink old partner and link new one on PATCH, returning all affected', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const oldPartnerForm = guestsTestManager.buildGuestFormDto();
      const oldPartner = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId, {
            guestForm: oldPartnerForm,
          }),
          accessToken,
        )
      )[0];

      const newPartnerForm = guestsTestManager.buildGuestFormDto();
      const newPartner = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId, {
            guestForm: newPartnerForm,
          }),
          accessToken,
        )
      )[0];

      const guestForm = guestsTestManager.buildGuestFormDto({
        ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({
          response: true,
          coupleId: oldPartner.id,
        }),
      });
      const guestAffected = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId, { guestForm }),
        accessToken,
      );
      const guest = guestAffected.find(
        (g) => g.name !== oldPartner.name && g.name !== newPartner.name,
      )!;

      const affected = await guestsTestManager.updateGuestForm(
        guest.id,
        { ifWithCouple: { response: true, coupleId: newPartner.id } },
        accessToken,
      );

      expect(affected).toHaveLength(3);

      const updatedGuest = findById(affected, guest.id);
      const updatedOldPartner = findById(affected, oldPartner.id);
      const updatedNewPartner = findById(affected, newPartner.id);

      expect(updatedGuest.guestForm?.ifWithCouple).toEqual({
        response: true,
        coupleId: newPartner.id,
      });
      expect(updatedOldPartner.guestForm?.ifWithCouple).toEqual({
        response: false,
      });
      expect(updatedNewPartner.guestForm?.ifWithCouple).toEqual({
        response: true,
        coupleId: guest.id,
      });
    });

    it('should default ifWithCouple response to false when guestForm has no ifWithCouple', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guestForm = guestsTestManager.buildGuestFormDto();
      const dto = guestsTestManager.buildCreateGuestDto(userId, { guestForm });
      const created = (
        await guestsTestManager.createGuest(dto, accessToken)
      )[0];

      expect(created.guestForm?.ifWithCouple).toEqual({ response: false });
    });

    describe('superUser ownership (?userId)', () => {
      let superUserToken: string;
      let superUserId: number;
      let plainUserId: number;

      beforeEach(async () => {
        const superUserDto = userAccountsTestManager.buildCreateUserDto({ role: UserRole.SUPER_USER });
        const superUser = await userAccountsTestManager.createUser(superUserDto);
        const { body } = await userAccountsTestManager.login(superUserDto);
        superUserToken = body.accessToken;
        superUserId = superUser.id;

        const plainUserDto = userAccountsTestManager.buildCreatePlainUserDto();
        const plainUser = await userAccountsTestManager.createActivatedPlainUser(superUserId, plainUserDto);
        plainUserId = plainUser.id;
      });

      it('should allow superUser to list plain user guests via ?userId', async () => {
        const dto = guestsTestManager.buildCreateGuestDto(plainUserId);
        await guestsTestManager.createGuest(dto, superUserToken, HttpStatus.CREATED, plainUserId);

        const list = await guestsTestManager.getAllGuests(superUserToken, HttpStatus.OK, plainUserId);
        expect(list).toHaveLength(1);
        expect(list[0].name).toBe(dto.guest_name);
      });

      it('should allow superUser to create a guest for plain user via ?userId', async () => {
        const dto = guestsTestManager.buildCreateGuestDto(plainUserId);
        const [created] = await guestsTestManager.createGuest(dto, superUserToken, HttpStatus.CREATED, plainUserId);

        expect(created.name).toBe(dto.guest_name);

        const list = await guestsTestManager.getAllGuests(superUserToken, HttpStatus.OK, plainUserId);
        expect(list).toHaveLength(1);
      });

      it('should allow superUser to update a plain user guest form via ?userId', async () => {
        const initialForm = guestsTestManager.buildGuestFormDto({ age_group: 'young' });
        const dto = guestsTestManager.buildCreateGuestDto(plainUserId, { guestForm: initialForm });
        const [guest] = await guestsTestManager.createGuest(dto, superUserToken, HttpStatus.CREATED, plainUserId);

        const [updated] = await guestsTestManager.updateGuestForm(
          guest.id,
          { age_group: 'old' },
          superUserToken,
          HttpStatus.OK,
          plainUserId,
        );

        expect(updated.guestForm).toEqual(expect.objectContaining({ age_group: 'old' }));
      });

      it('should allow superUser to delete a plain user guest via ?userId', async () => {
        const dto = guestsTestManager.buildCreateGuestDto(plainUserId);
        const [guest] = await guestsTestManager.createGuest(dto, superUserToken, HttpStatus.CREATED, plainUserId);

        await guestsTestManager.deleteGuestById(guest.id, superUserToken, HttpStatus.NO_CONTENT, plainUserId);

        const list = await guestsTestManager.getAllGuests(superUserToken, HttpStatus.OK, plainUserId);
        expect(list).toHaveLength(0);
      });

      it('should return 403 when a non-creator superUser accesses the plain user data', async () => {
        const otherSuperUserDto = userAccountsTestManager.buildCreateUserDto({ role: UserRole.SUPER_USER });
        await userAccountsTestManager.createUser(otherSuperUserDto);
        const { body: otherBody } = await userAccountsTestManager.login(otherSuperUserDto);

        await guestsTestManager.getAllGuests(otherBody.accessToken, HttpStatus.FORBIDDEN, plainUserId);
      });

      it('should return 403 when a plain user passes ?userId', async () => {
        const plainUserDto2 = userAccountsTestManager.buildCreatePlainUserDto();
        const plainUser2 = await userAccountsTestManager.createActivatedPlainUser(superUserId, plainUserDto2);
        const { body: plainBody } = await userAccountsTestManager.login({
          login: plainUserDto2.login,
          password: plainUserDto2.password,
        });

        await guestsTestManager.getAllGuests(plainBody.accessToken, HttpStatus.FORBIDDEN, plainUserId);
      });
    });

    it('should return 400 for invalid enum value in update', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guestForm = guestsTestManager.buildGuestFormDto();
      const dto = guestsTestManager.buildCreateGuestDto(userId, { guestForm });
      const created = (
        await guestsTestManager.createGuest(dto, accessToken)
      )[0];

      await guestsTestManager.updateGuestForm(
        created.id,
        { age_group: 'invalid_value' as any },
        accessToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    });
  });

  // ─── Guest Responses ───────────────────────────────────────────────────────

  describe('Guest Responses', () => {
    it('should submit a response for an existing guest', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guest = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId),
          accessToken,
        )
      )[0];

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

      const guest = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId),
          accessToken,
        )
      )[0];

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

      const guest = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId),
          accessToken,
        )
      )[0];

      const responseDto = guestsTestManager.buildCreateGuestResponseDto({
        plus_one: true,
        plus_one_name: undefined,
      });

      await guestsTestManager.createGuestResponse(
        guest.id,
        responseDto,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    });

    it('should submit response with plus_one and plus_one_name', async () => {
      const { userId, accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const guest = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId),
          accessToken,
        )
      )[0];

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

      const guest = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId),
          accessToken,
        )
      )[0];

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

      const guest = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId1),
          token1,
        )
      )[0];

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

      const guest = (
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId),
          accessToken,
        )
      )[0];

      await guestsTestManager.deleteGuestResponse(
        guest.id,
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });
  });
});
