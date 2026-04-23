import { HttpStatus, INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getOptionsToken } from '@nestjs/throttler';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { ChecklistItemPriority } from '../src/modules/checklist/domain/entities/checklist-item.entity';
import { initTesting } from './helpers/initTesting';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { ChecklistTestManager } from './helpers/checklist/checklist.test-manager';
import { UserRole } from '../src/modules/user-accounts/domain/entities/user-role.enum';
import { ChecklistQueryRepository } from '../src/modules/checklist/infra/query/checklist.query-repository';

describe('Checklist (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;
  let checklistTestManager: ChecklistTestManager;
  let checklistQueryRepository: ChecklistQueryRepository;

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
    checklistTestManager = result.checklistTestManager;
    checklistQueryRepository = app.get(ChecklistQueryRepository);
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Checklist root', () => {
    it('should create an empty checklist during regular user registration', async () => {
      const { userId } = await userAccountsTestManager.createUserAndLogin();

      const checklist =
        await checklistQueryRepository.findFullChecklistByUserId(userId);

      expect(checklist).not.toBeNull();
      expect(checklist?.phases).toEqual([]);
    });

    it('should return a default checklist with ru locale for a new user', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const checklist = await checklistTestManager.getChecklist(accessToken);

      expect(checklist).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          phases: expect.any(Array),
        }),
      );
      expect(checklist.phases).toHaveLength(5);
      expect(checklist.phases.map((phase: any) => phase.timeline)).toEqual([
        '12–10 месяцев до свадьбы',
        '9–7 месяцев до свадьбы',
        '6–4 месяцев до свадьбы',
        '3–1 месяцев до свадьбы',
        'Последние 7 дней',
      ]);
      checklist.phases.forEach((phase: any, index: number) => {
        expect(phase).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: null,
            timeline: expect.any(String),
            icon: null,
            sortOrder: index,
            items: expect.any(Array),
          }),
        );
        expect(phase.items.length).toBeGreaterThan(0);
      });
      expect(checklist.phases[0].items.map((item: any) => item.title)).toEqual([
        'Определить бюджет',
        'Составить список гостей',
        'Выбрать дату свадьбы',
        'Забронировать площадку',
        'Найти организатора',
      ]);
    });

    it('should return a default checklist with en locale', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const checklist = await checklistTestManager.getChecklist(
        accessToken,
        HttpStatus.OK,
        'en',
      );

      expect(checklist.phases).toHaveLength(5);
      expect(checklist.phases.map((phase: any) => phase.timeline)).toEqual([
        '12–10 months before',
        '9–7 months before',
        '6–4 months before',
        '3–1 months before',
        'Last 7 days',
      ]);
      expect(checklist.phases[0].items.map((item: any) => item.title)).toEqual([
        'Set wedding budget',
        'Draft guest list',
        'Choose wedding date',
        'Book venue',
        'Hire planner if needed',
      ]);
    });

    it('should seed an existing empty checklist for a regular user on first get', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();

      const checklistBeforeGet =
        await checklistQueryRepository.findFullChecklistByUserId(userId);

      expect(checklistBeforeGet).not.toBeNull();
      expect(checklistBeforeGet?.phases).toEqual([]);

      const checklist = await checklistTestManager.getChecklist(accessToken);

      expect(checklist.phases).toHaveLength(5);

      const checklistAfterGet =
        await checklistQueryRepository.findFullChecklistByUserId(userId);

      expect(checklistAfterGet).not.toBeNull();
      expect(checklistAfterGet?.phases).toHaveLength(5);
    });

    it('should seed an existing empty checklist for a plain user created by super user', async () => {
      const superUserDto = userAccountsTestManager.buildCreateUserDto({
        role: UserRole.SUPER_USER,
      });
      const superUser = await userAccountsTestManager.createUser(superUserDto);
      const { body } = await userAccountsTestManager.login(superUserDto);

      const plainUserDto = userAccountsTestManager.buildCreatePlainUserDto();
      const plainUser = await userAccountsTestManager.createActivatedPlainUser(
        superUser.id,
        plainUserDto,
      );

      const checklistBeforeGet =
        await checklistQueryRepository.findFullChecklistByUserId(plainUser.id);

      expect(checklistBeforeGet).not.toBeNull();
      expect(checklistBeforeGet?.phases).toEqual([]);

      const checklist = await checklistTestManager.getChecklist(
        body.accessToken,
        HttpStatus.OK,
        undefined,
        plainUser.id,
      );

      expect(checklist.phases).toHaveLength(5);

      const checklistAfterGet =
        await checklistQueryRepository.findFullChecklistByUserId(plainUser.id);

      expect(checklistAfterGet).not.toBeNull();
      expect(checklistAfterGet?.phases).toHaveLength(5);
    });

    it('should return 401 without auth', async () => {
      await checklistTestManager.getChecklist(
        'invalid-token',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should reset checklist to default phases and items', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const checklist = await checklistTestManager.getChecklist(accessToken);
      const firstPhaseId = checklist.phases[0].id;

      await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Custom phase' }),
        accessToken,
      );
      await checklistTestManager.createItem(
        firstPhaseId,
        checklistTestManager.buildCreateItemDto({ title: 'Custom item' }),
        accessToken,
      );

      const resetChecklist =
        await checklistTestManager.resetChecklist(accessToken);

      expect(resetChecklist.phases).toHaveLength(5);
      expect(resetChecklist.phases.map((phase: any) => phase.name)).toEqual([
        null,
        null,
        null,
        null,
        null,
      ]);
      expect(
        resetChecklist.phases[0].items.map((item: any) => item.title),
      ).toEqual([
        'Определить бюджет',
        'Составить список гостей',
        'Выбрать дату свадьбы',
        'Забронировать площадку',
        'Найти организатора',
      ]);
    });
  });

  describe('Phases', () => {
    it('should create a phase and append it to the end', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const created = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({
          name: 'After party',
          timeline: 'One week before',
          icon: 'flowers',
        }),
        accessToken,
      );

      expect(created).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'After party',
          timeline: 'One week before',
          icon: 'flowers',
          sortOrder: 0,
          items: [],
        }),
      );
    });

    it('should update a phase and allow clearing optional fields', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const checklist = await checklistTestManager.getChecklist(accessToken);
      const phaseId = checklist.phases[0].id;

      const updated = await checklistTestManager.updatePhase(
        phaseId,
        checklistTestManager.buildUpdatePhaseDto({
          name: 'Ceremony',
          timeline: null,
          icon: null,
        }),
        accessToken,
      );

      expect(updated).toEqual(
        expect.objectContaining({
          id: phaseId,
          name: 'Ceremony',
          timeline: null,
          icon: null,
        }),
      );
    });

    it('should keep previous phase fields when they are omitted in patch dto', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const created = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({
          name: 'Initial phase',
          timeline: 'Initial timeline',
          icon: 'rings',
        }),
        accessToken,
      );

      const updated = await checklistTestManager.updatePhase(
        created.id,
        checklistTestManager.buildUpdatePhaseDto({
          timeline: 'Updated timeline',
        }),
        accessToken,
      );

      expect(updated).toEqual(
        expect.objectContaining({
          id: created.id,
          name: 'Initial phase',
          timeline: 'Updated timeline',
          icon: 'rings',
        }),
      );
    });

    it('should reindex remaining phases after delete', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const phaseA = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Phase A' }),
        accessToken,
      );
      await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Phase B' }),
        accessToken,
      );

      await checklistTestManager.deletePhase(phaseA.id, accessToken);

      const checklist = await checklistTestManager.getChecklist(accessToken);
      expect(checklist.phases).toHaveLength(1);
      expect(checklist.phases.map((phase: any) => phase.name)).not.toContain(
        'Phase A',
      );
    });

    it('should reject creating more than 10 phases', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      for (let index = 0; index < 10; index += 1) {
        await checklistTestManager.createPhase(
          checklistTestManager.buildCreatePhaseDto({
            name: `Custom ${index + 1}`,
          }),
          accessToken,
        );
      }

      const response = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Overflow phase' }),
        accessToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      expect(response).toEqual({
        errorsMessages: [
          {
            field: 'name',
            message: 'Maximum of 10 phases per checklist reached',
          },
        ],
      });
    });

    it("should not allow mutating another user's phase", async () => {
      const { accessToken: tokenA } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } =
        await userAccountsTestManager.createUserAndLogin();

      const checklist = await checklistTestManager.getChecklist(tokenA);
      const phaseId = checklist.phases[0].id;

      await checklistTestManager.updatePhase(
        phaseId,
        { name: 'Hacked' },
        tokenB,
        HttpStatus.FORBIDDEN,
      );
      await checklistTestManager.deletePhase(
        phaseId,
        tokenB,
        HttpStatus.FORBIDDEN,
      );
    });
  });

  describe('Items', () => {
    it('should create an item with defaults', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const phase = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Items phase' }),
        accessToken,
      );
      const phaseId = phase.id;

      const item = await checklistTestManager.createItem(
        phaseId,
        checklistTestManager.buildCreateItemDto({
          title: 'Book DJ',
          note: 'Check reviews',
        }),
        accessToken,
      );

      expect(item).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: 'Book DJ',
          note: 'Check reviews',
          comment: null,
          completed: false,
          priority: ChecklistItemPriority.Normal,
          sortOrder: 0,
        }),
      );
    });

    it('should update an item and clear optional fields with null', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const phase = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Items phase' }),
        accessToken,
      );
      const phaseId = phase.id;
      const item = await checklistTestManager.createItem(
        phaseId,
        checklistTestManager.buildCreateItemDto({
          title: 'Initial',
          note: 'Temporary',
        }),
        accessToken,
      );

      const updated = await checklistTestManager.updateItem(
        phaseId,
        item.id,
        checklistTestManager.buildUpdateItemDto({
          title: 'Updated',
          note: null,
          comment: 'Call vendor',
          completed: true,
          priority: ChecklistItemPriority.High,
        }),
        accessToken,
      );

      expect(updated).toEqual(
        expect.objectContaining({
          id: item.id,
          title: 'Updated',
          note: null,
          comment: 'Call vendor',
          completed: true,
          priority: ChecklistItemPriority.High,
        }),
      );
    });

    it('should keep previous item fields when they are omitted in patch dto', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const phase = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Items phase' }),
        accessToken,
      );
      const phaseId = phase.id;
      const item = await checklistTestManager.createItem(
        phaseId,
        checklistTestManager.buildCreateItemDto({
          title: 'Initial title',
          note: 'Initial note',
          priority: ChecklistItemPriority.Normal,
        }),
        accessToken,
      );

      const withComment = await checklistTestManager.updateItem(
        phaseId,
        item.id,
        checklistTestManager.buildUpdateItemDto({
          comment: 'Initial comment',
        }),
        accessToken,
      );

      const updated = await checklistTestManager.updateItem(
        phaseId,
        item.id,
        checklistTestManager.buildUpdateItemDto({
          completed: true,
        }),
        accessToken,
      );

      expect(withComment).toEqual(
        expect.objectContaining({
          id: item.id,
          title: 'Initial title',
          note: 'Initial note',
          comment: 'Initial comment',
          completed: false,
          priority: ChecklistItemPriority.Normal,
        }),
      );

      expect(updated).toEqual(
        expect.objectContaining({
          id: item.id,
          title: 'Initial title',
          note: 'Initial note',
          comment: 'Initial comment',
          completed: true,
          priority: ChecklistItemPriority.Normal,
        }),
      );
    });

    it('should toggle item completion', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const phase = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Items phase' }),
        accessToken,
      );
      const phaseId = phase.id;
      const item = await checklistTestManager.createItem(
        phaseId,
        checklistTestManager.buildCreateItemDto(),
        accessToken,
      );

      const toggled = await checklistTestManager.toggleItem(
        phaseId,
        item.id,
        accessToken,
      );

      expect(toggled).toEqual({ id: item.id, completed: true });
    });

    it('should delete an item', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const phase = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Items phase' }),
        accessToken,
      );
      const phaseId = phase.id;
      const item = await checklistTestManager.createItem(
        phaseId,
        checklistTestManager.buildCreateItemDto(),
        accessToken,
      );

      await checklistTestManager.deleteItem(phaseId, item.id, accessToken);

      const updatedChecklist =
        await checklistTestManager.getChecklist(accessToken);
      const updatedPhase = updatedChecklist.phases.find(
        (existingPhase: any) => existingPhase.id === phaseId,
      );
      expect(updatedPhase.items).toEqual([]);
    });

    it('should reorder items within the same phase', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const phase = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Items phase' }),
        accessToken,
      );
      const phaseId = phase.id;
      const itemA = await checklistTestManager.createItem(
        phaseId,
        checklistTestManager.buildCreateItemDto({ title: 'Item A' }),
        accessToken,
      );
      await checklistTestManager.createItem(
        phaseId,
        checklistTestManager.buildCreateItemDto({ title: 'Item B' }),
        accessToken,
      );
      await checklistTestManager.createItem(
        phaseId,
        checklistTestManager.buildCreateItemDto({ title: 'Item C' }),
        accessToken,
      );

      await checklistTestManager.moveItem(
        {
          itemId: itemA.id,
          targetPhaseId: phaseId,
          targetIndex: 2,
        },
        accessToken,
      );

      const updatedChecklist =
        await checklistTestManager.getChecklist(accessToken);
      const updatedPhase = updatedChecklist.phases.find(
        (existingPhase: any) => existingPhase.id === phaseId,
      );
      expect(updatedPhase.items.map((item: any) => item.title)).toEqual([
        'Item B',
        'Item C',
        'Item A',
      ]);
      expect(updatedPhase.items.map((item: any) => item.sortOrder)).toEqual([
        0, 1, 2,
      ]);
    });

    it('should move an item to another phase and keep source empty when it was the last one', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const sourcePhase = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Source phase' }),
        accessToken,
      );
      const targetPhase = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Target phase' }),
        accessToken,
      );
      const sourcePhaseId = sourcePhase.id;
      const targetPhaseId = targetPhase.id;
      const movedItem = await checklistTestManager.createItem(
        sourcePhaseId,
        checklistTestManager.buildCreateItemDto({ title: 'Move me' }),
        accessToken,
      );

      await checklistTestManager.moveItem(
        {
          itemId: movedItem.id,
          targetPhaseId,
          targetIndex: 0,
        },
        accessToken,
      );

      const updatedChecklist =
        await checklistTestManager.getChecklist(accessToken);
      const updatedSourcePhase = updatedChecklist.phases.find(
        (phase: any) => phase.id === sourcePhaseId,
      );
      const updatedTargetPhase = updatedChecklist.phases.find(
        (phase: any) => phase.id === targetPhaseId,
      );

      expect(updatedSourcePhase.items).toEqual([]);
      expect(updatedTargetPhase.items).toEqual([
        expect.objectContaining({
          id: movedItem.id,
          title: 'Move me',
          sortOrder: 0,
        }),
      ]);
    });

    it('should reject creating more than 10 items in a phase', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const phase = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Items phase' }),
        accessToken,
      );
      const phaseId = phase.id;

      for (let index = 0; index < 10; index += 1) {
        await checklistTestManager.createItem(
          phaseId,
          checklistTestManager.buildCreateItemDto({ title: `Item ${index}` }),
          accessToken,
        );
      }

      const response = await checklistTestManager.createItem(
        phaseId,
        checklistTestManager.buildCreateItemDto({ title: 'Overflow item' }),
        accessToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      expect(response).toEqual({
        errorsMessages: [
          {
            field: 'title',
            message: 'Maximum of 10 items per phase reached',
          },
        ],
      });
    });

    it('should reject moving an item into a full target phase', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const sourcePhase = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Source phase' }),
        accessToken,
      );
      const targetPhase = await checklistTestManager.createPhase(
        checklistTestManager.buildCreatePhaseDto({ name: 'Target phase' }),
        accessToken,
      );
      const sourcePhaseId = sourcePhase.id;
      const targetPhaseId = targetPhase.id;
      const movedItem = await checklistTestManager.createItem(
        sourcePhaseId,
        checklistTestManager.buildCreateItemDto({ title: 'Move blocked' }),
        accessToken,
      );

      for (let index = 0; index < 10; index += 1) {
        await checklistTestManager.createItem(
          targetPhaseId,
          checklistTestManager.buildCreateItemDto({ title: `Target ${index}` }),
          accessToken,
        );
      }

      const response = await checklistTestManager.moveItem(
        {
          itemId: movedItem.id,
          targetPhaseId,
          targetIndex: 10,
        },
        accessToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      expect(response).toEqual({
        errorsMessages: [
          {
            field: 'targetPhaseId',
            message: 'Maximum of 10 items per phase reached',
          },
        ],
      });
    });

    describe('superUser ownership (?userId)', () => {
      let superUserToken: string;
      let superUserId: number;
      let plainUserId: number;

      beforeEach(async () => {
        const superUserDto = userAccountsTestManager.buildCreateUserDto({
          role: UserRole.SUPER_USER,
        });
        const superUser =
          await userAccountsTestManager.createUser(superUserDto);
        const { body } = await userAccountsTestManager.login(superUserDto);
        superUserToken = body.accessToken;
        superUserId = superUser.id;

        const plainUserDto = userAccountsTestManager.buildCreatePlainUserDto();
        const plainUser =
          await userAccountsTestManager.createActivatedPlainUser(
            superUserId,
            plainUserDto,
          );
        plainUserId = plainUser.id;
      });

      it('should allow superUser to read plain user checklist via ?userId', async () => {
        const checklist = await checklistTestManager.getChecklist(
          superUserToken,
          HttpStatus.OK,
          undefined,
          plainUserId,
        );

        expect(checklist).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            phases: expect.any(Array),
          }),
        );
        expect(checklist.phases).toHaveLength(5);
      });

      it('should allow superUser to create a phase for plain user via ?userId', async () => {
        const checklist = await checklistTestManager.getChecklist(
          superUserToken,
          HttpStatus.OK,
          undefined,
          plainUserId,
        );
        const phase = await checklistTestManager.createPhase(
          checklistTestManager.buildCreatePhaseDto({ name: 'SuperUser Phase' }),
          superUserToken,
          HttpStatus.CREATED,
          plainUserId,
        );

        expect(phase).toEqual(
          expect.objectContaining({ name: 'SuperUser Phase' }),
        );

        const updated = await checklistTestManager.getChecklist(
          superUserToken,
          HttpStatus.OK,
          undefined,
          plainUserId,
        );
        expect(updated.phases).toHaveLength(checklist.phases.length + 1);
      });

      it('should allow superUser to add item to plain user checklist phase via ?userId', async () => {
        const checklist = await checklistTestManager.getChecklist(
          superUserToken,
          HttpStatus.OK,
          undefined,
          plainUserId,
        );
        const phaseId = checklist.phases[0].id;

        const item = await checklistTestManager.createItem(
          phaseId,
          checklistTestManager.buildCreateItemDto({ title: 'SuperUser Item' }),
          superUserToken,
          HttpStatus.CREATED,
          plainUserId,
        );

        expect(item).toEqual(
          expect.objectContaining({ title: 'SuperUser Item' }),
        );
      });

      it('should return 403 when a non-creator superUser accesses the plain user checklist', async () => {
        const otherSuperUserDto = userAccountsTestManager.buildCreateUserDto({
          role: UserRole.SUPER_USER,
        });
        await userAccountsTestManager.createUser(otherSuperUserDto);
        const { body: otherBody } =
          await userAccountsTestManager.login(otherSuperUserDto);

        await checklistTestManager.getChecklist(
          otherBody.accessToken,
          HttpStatus.FORBIDDEN,
          undefined,
          plainUserId,
        );
      });

      it('should return 403 when a plain user passes ?userId', async () => {
        const plainUserDto2 = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createActivatedPlainUser(
          superUserId,
          plainUserDto2,
        );
        const { body: plainBody } = await userAccountsTestManager.login({
          login: plainUserDto2.login,
          password: plainUserDto2.password,
        });

        await checklistTestManager.getChecklist(
          plainBody.accessToken,
          HttpStatus.FORBIDDEN,
          undefined,
          plainUserId,
        );
      });
    });

    it("should not allow mutating another user's item", async () => {
      const { accessToken: tokenA } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } =
        await userAccountsTestManager.createUserAndLogin();
      const checklistA = await checklistTestManager.getChecklist(tokenA);
      const checklistB = await checklistTestManager.getChecklist(tokenB);
      const phaseId = checklistA.phases[0].id;
      const item = await checklistTestManager.createItem(
        phaseId,
        checklistTestManager.buildCreateItemDto(),
        tokenA,
      );

      await checklistTestManager.updateItem(
        phaseId,
        item.id,
        { title: 'Hacked' },
        tokenB,
        HttpStatus.FORBIDDEN,
      );
      await checklistTestManager.deleteItem(
        phaseId,
        item.id,
        tokenB,
        HttpStatus.FORBIDDEN,
      );
      await checklistTestManager.moveItem(
        {
          itemId: item.id,
          targetPhaseId: checklistB.phases[0].id,
          targetIndex: 0,
        },
        tokenB,
        HttpStatus.FORBIDDEN,
      );
    });
  });
});
