import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getOptionsToken } from '@nestjs/throttler';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { ScenarioPointIcon } from '../src/modules/scenario/domain/entities/scenario-point.entity';
import { initTesting } from './helpers/initTesting';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { ScenarioTestManager } from './helpers/scenario/scenario.test-manager';
import { UserRole } from '../src/modules/user-accounts/domain/entities/user-role.enum';

describe('Scenario (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;
  let scenarioTestManager: ScenarioTestManager;

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
    scenarioTestManager = result.scenarioTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Scenario root', () => {
    it('should return an empty scenario for a new user', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const scenario = await scenarioTestManager.getScenario(accessToken);

      expect(scenario).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          points: [],
        }),
      );
    });

    it('should return the same scenario id on repeated GET calls', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const first = await scenarioTestManager.getScenario(accessToken);
      const second = await scenarioTestManager.getScenario(accessToken);

      expect(first.id).toBe(second.id);
    });

    it('should return 401 without auth', async () => {
      await scenarioTestManager.getScenario(
        'invalid-token',
        HttpStatus.UNAUTHORIZED,
      );
    });
  });

  describe('Seed', () => {
    it('should seed with ru locale and return 22 points', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const scenario = await scenarioTestManager.seedScenario(
        accessToken,
        HttpStatus.OK,
        'ru',
      );

      expect(scenario.points).toHaveLength(22);
      expect(scenario.points[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          time: '08:00',
          title: 'Подъём, душ',
          icon: ScenarioPointIcon.SunRise,
          note: '',
          duration: 30,
        }),
      );
    });

    it('should seed with en locale and return 22 points with English titles', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const scenario = await scenarioTestManager.seedScenario(
        accessToken,
        HttpStatus.OK,
        'en',
      );

      expect(scenario.points).toHaveLength(22);
      expect(scenario.points[0].title).toBe('Wake Up, Shower');
    });

    it('should use ru as default locale when locale is omitted', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const scenario = await scenarioTestManager.seedScenario(accessToken);

      expect(scenario.points[0].title).toBe('Подъём, душ');
    });

    it('should replace existing points when seeded again', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      await scenarioTestManager.seedScenario(accessToken);
      await scenarioTestManager.createPoint(
        scenarioTestManager.buildCreatePointDto({ title: 'Custom Event' }),
        accessToken,
      );

      const reseeded = await scenarioTestManager.seedScenario(accessToken);

      expect(reseeded.points).toHaveLength(22);
      expect(reseeded.points.map((p: any) => p.title)).not.toContain(
        'Custom Event',
      );
    });
  });

  describe('Points — create', () => {
    it('should create a point and return the full scenario', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const scenario = await scenarioTestManager.createPoint(
        scenarioTestManager.buildCreatePointDto({
          time: '14:30',
          title: 'Ceremony',
          icon: ScenarioPointIcon.Ceremony,
          note: 'At the chapel',
        }),
        accessToken,
      );

      expect(scenario).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          points: expect.any(Array),
        }),
      );
      expect(scenario.points).toHaveLength(1);
      expect(scenario.points[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          time: '14:30',
          title: 'Ceremony',
          icon: ScenarioPointIcon.Ceremony,
          note: 'At the chapel',
          duration: null,
        }),
      );
    });

    it('should create a point with duration', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const scenario = await scenarioTestManager.createPoint(
        scenarioTestManager.buildCreatePointDto({
          time: '10:00',
          duration: 45,
        }),
        accessToken,
      );

      expect(scenario.points[0].duration).toBe(45);
    });

    it('should default icon to ceremony and note to empty string when omitted', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const scenario = await scenarioTestManager.createPoint(
        { time: '10:00', title: 'Minimal point' },
        accessToken,
      );

      expect(scenario.points[0]).toEqual(
        expect.objectContaining({
          icon: ScenarioPointIcon.Ceremony,
          note: '',
        }),
      );
    });

    it('should reject invalid time format', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await scenarioTestManager.createPoint(
        { time: '25:00', title: 'Bad time' },
        accessToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      await scenarioTestManager.createPoint(
        { time: '9:00', title: 'Missing leading zero' },
        accessToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    });

    it('should reject title longer than 50 chars', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await scenarioTestManager.createPoint(
        { time: '10:00', title: 'A'.repeat(51) },
        accessToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    });

    it('should reject unknown icon value', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await scenarioTestManager.createPoint(
        {
          time: '10:00',
          title: 'Bad icon',
          icon: 'unknown-icon' as ScenarioPointIcon,
        },
        accessToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    });

    it('should reject duplicate time', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await scenarioTestManager.createPoint(
        { time: '10:00', title: 'First' },
        accessToken,
      );

      const response = await scenarioTestManager.createPoint(
        { time: '10:00', title: 'Duplicate' },
        accessToken,
        HttpStatus.CONFLICT,
      );

      expect(response).toEqual({
        errorsMessages: [
          { field: 'time', message: 'errors.scenario.timeAlreadyExists' },
        ],
      });
    });

    it('should return 401 without auth', async () => {
      await scenarioTestManager.createPoint(
        { time: '10:00', title: 'Test' },
        'invalid-token',
        HttpStatus.UNAUTHORIZED,
      );
    });
  });

  describe('Points — update', () => {
    it('should partially update a point and return the updated point', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const created = await scenarioTestManager.createPoint(
        scenarioTestManager.buildCreatePointDto({
          time: '10:00',
          title: 'Initial',
          icon: ScenarioPointIcon.Ceremony,
          note: 'Initial note',
        }),
        accessToken,
      );
      const pointId = created.points[0].id;

      const updated = await scenarioTestManager.updatePoint(
        pointId,
        scenarioTestManager.buildUpdatePointDto({
          title: 'Updated',
          time: '11:00',
        }),
        accessToken,
      );

      expect(updated).toEqual(
        expect.objectContaining({
          id: pointId,
          time: '11:00',
          title: 'Updated',
          icon: ScenarioPointIcon.Ceremony,
          note: 'Initial note',
        }),
      );
    });

    it('should keep existing fields when they are omitted in patch', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const created = await scenarioTestManager.createPoint(
        scenarioTestManager.buildCreatePointDto({
          time: '14:00',
          title: 'Keep me',
          icon: ScenarioPointIcon.Dinner,
          note: 'Keep this note',
        }),
        accessToken,
      );
      const pointId = created.points[0].id;

      const updated = await scenarioTestManager.updatePoint(
        pointId,
        scenarioTestManager.buildUpdatePointDto({ time: '15:00' }),
        accessToken,
      );

      expect(updated).toEqual(
        expect.objectContaining({
          time: '15:00',
          title: 'Keep me',
          icon: ScenarioPointIcon.Dinner,
          note: 'Keep this note',
        }),
      );
    });

    it('should set and then clear duration', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const created = await scenarioTestManager.createPoint(
        scenarioTestManager.buildCreatePointDto({
          time: '10:00',
          duration: 60,
        }),
        accessToken,
      );
      const pointId = created.points[0].id;

      const cleared = await scenarioTestManager.updatePoint(
        pointId,
        scenarioTestManager.buildUpdatePointDto({ duration: null }),
        accessToken,
      );

      expect(cleared.duration).toBeNull();
    });

    it('should clear note when patching with null', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const created = await scenarioTestManager.createPoint(
        scenarioTestManager.buildCreatePointDto({ note: 'Some note' }),
        accessToken,
      );
      const pointId = created.points[0].id;

      const updated = await scenarioTestManager.updatePoint(
        pointId,
        scenarioTestManager.buildUpdatePointDto({ note: null }),
        accessToken,
      );

      expect(updated.note).toBe('');
    });

    it('should return 404 for a non-existent point id', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await scenarioTestManager.updatePoint(
        '00000000-0000-0000-0000-000000000000',
        scenarioTestManager.buildUpdatePointDto({ title: 'Ghost' }),
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it("should not allow updating another user's point", async () => {
      const { accessToken: tokenA } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } =
        await userAccountsTestManager.createUserAndLogin();

      const created = await scenarioTestManager.createPoint(
        scenarioTestManager.buildCreatePointDto({ title: 'User A point' }),
        tokenA,
      );
      const pointId = created.points[0].id;

      await scenarioTestManager.updatePoint(
        pointId,
        scenarioTestManager.buildUpdatePointDto({ title: 'Hacked' }),
        tokenB,
        HttpStatus.FORBIDDEN,
      );
    });
  });

  describe('Points — delete', () => {
    it('should delete a point', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const created = await scenarioTestManager.createPoint(
        scenarioTestManager.buildCreatePointDto(),
        accessToken,
      );
      const pointId = created.points[0].id;

      await scenarioTestManager.deletePoint(pointId, accessToken);

      const scenario = await scenarioTestManager.getScenario(accessToken);
      expect(scenario.points).toEqual([]);
    });

    it('should return 404 for a non-existent point id', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await scenarioTestManager.deletePoint(
        '00000000-0000-0000-0000-000000000000',
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it("should not allow deleting another user's point", async () => {
      const { accessToken: tokenA } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } =
        await userAccountsTestManager.createUserAndLogin();

      const created = await scenarioTestManager.createPoint(
        scenarioTestManager.buildCreatePointDto(),
        tokenA,
      );
      const pointId = created.points[0].id;

      await scenarioTestManager.deletePoint(
        pointId,
        tokenB,
        HttpStatus.FORBIDDEN,
      );
    });
  });

  describe('Super-user ownership (?userId)', () => {
    let superUserToken: string;
    let superUserId: number;
    let plainUserId: number;

    beforeEach(async () => {
      const superUserDto = userAccountsTestManager.buildCreateUserDto({
        role: UserRole.SUPER_USER,
      });
      const superUser = await userAccountsTestManager.createUser(superUserDto);
      const { body } = await userAccountsTestManager.login(superUserDto);
      superUserToken = body.accessToken;
      superUserId = superUser.id;

      const plainUserDto = userAccountsTestManager.buildCreatePlainUserDto();
      const plainUser = await userAccountsTestManager.createActivatedPlainUser(
        superUserId,
        plainUserDto,
      );
      plainUserId = plainUser.id;
    });

    it('should allow superUser to read plain user scenario via ?userId', async () => {
      const scenario = await scenarioTestManager.getScenario(
        superUserToken,
        HttpStatus.OK,
        plainUserId,
      );

      expect(scenario).toEqual(
        expect.objectContaining({ id: expect.any(String), points: [] }),
      );
    });

    it('should allow superUser to create a point for plain user via ?userId', async () => {
      const scenario = await scenarioTestManager.createPoint(
        scenarioTestManager.buildCreatePointDto({ title: 'SuperUser Point' }),
        superUserToken,
        HttpStatus.CREATED,
        plainUserId,
      );

      expect(scenario.points).toHaveLength(1);
      expect(scenario.points[0].title).toBe('SuperUser Point');
    });

    it('should allow superUser to seed plain user scenario via ?userId', async () => {
      const scenario = await scenarioTestManager.seedScenario(
        superUserToken,
        HttpStatus.OK,
        'en',
        plainUserId,
      );

      expect(scenario.points).toHaveLength(22);
    });

    it('should return 403 when a non-creator superUser accesses the plain user scenario', async () => {
      const otherSuperUserDto = userAccountsTestManager.buildCreateUserDto({
        role: UserRole.SUPER_USER,
      });
      await userAccountsTestManager.createUser(otherSuperUserDto);
      const { body: otherBody } = await userAccountsTestManager.login(otherSuperUserDto);

      await scenarioTestManager.getScenario(
        otherBody.accessToken,
        HttpStatus.FORBIDDEN,
        plainUserId,
      );
    });

    it('should return 403 when a plain user passes ?userId', async () => {
      const plainUserDto2 = userAccountsTestManager.buildCreatePlainUserDto();
      await userAccountsTestManager.createActivatedPlainUser(
        superUserId,
        plainUserDto2,
      );
      const { body: plainBody } = await userAccountsTestManager.login(plainUserDto2);

      await scenarioTestManager.getScenario(
        plainBody.accessToken,
        HttpStatus.FORBIDDEN,
        plainUserId,
      );
    });
  });
});
