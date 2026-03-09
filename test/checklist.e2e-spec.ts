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

describe('Checklist (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;
  let checklistTestManager: ChecklistTestManager;

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
    it('should return a default checklist for a new user', async () => {
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
        '12–10 months before',
        '9–7 months before',
        '6–4 months before',
        '3–1 months before',
        'Last 7 days',
      ]);
      checklist.phases.forEach((phase: any, index: number) => {
        expect(phase).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: null,
            timeline: expect.any(String),
            icon: null,
            sortOrder: index,
            items: [],
          }),
        );
      });
    });

    it('should return 401 without auth', async () => {
      await checklistTestManager.getChecklist(
        'invalid-token',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should reset checklist to default phases only', async () => {
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
        resetChecklist.phases.every((phase: any) => phase.items.length === 0),
      ).toBe(true);
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
          sortOrder: 5,
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
      expect(checklist.phases).toHaveLength(6);
      expect(checklist.phases.map((phase: any) => phase.sortOrder)).toEqual([
        0, 1, 2, 3, 4, 5,
      ]);
      expect(checklist.phases.map((phase: any) => phase.name)).not.toContain(
        'Phase A',
      );
    });

    it('should reject creating more than 10 phases', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      for (let index = 0; index < 5; index += 1) {
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
      const checklist = await checklistTestManager.getChecklist(accessToken);
      const phaseId = checklist.phases[0].id;

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
      const checklist = await checklistTestManager.getChecklist(accessToken);
      const phaseId = checklist.phases[0].id;
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
      const checklist = await checklistTestManager.getChecklist(accessToken);
      const phaseId = checklist.phases[0].id;
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
      const checklist = await checklistTestManager.getChecklist(accessToken);
      const phaseId = checklist.phases[0].id;
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
      const checklist = await checklistTestManager.getChecklist(accessToken);
      const phaseId = checklist.phases[0].id;
      const item = await checklistTestManager.createItem(
        phaseId,
        checklistTestManager.buildCreateItemDto(),
        accessToken,
      );

      await checklistTestManager.deleteItem(phaseId, item.id, accessToken);

      const updatedChecklist =
        await checklistTestManager.getChecklist(accessToken);
      expect(updatedChecklist.phases[0].items).toEqual([]);
    });

    it('should reorder items within the same phase', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const checklist = await checklistTestManager.getChecklist(accessToken);
      const phaseId = checklist.phases[0].id;
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
      expect(
        updatedChecklist.phases[0].items.map((item: any) => item.title),
      ).toEqual(['Item B', 'Item C', 'Item A']);
      expect(
        updatedChecklist.phases[0].items.map((item: any) => item.sortOrder),
      ).toEqual([0, 1, 2]);
    });

    it('should move an item to another phase and keep source empty when it was the last one', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const checklist = await checklistTestManager.getChecklist(accessToken);
      const sourcePhaseId = checklist.phases[0].id;
      const targetPhaseId = checklist.phases[1].id;
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
      const sourcePhase = updatedChecklist.phases.find(
        (phase: any) => phase.id === sourcePhaseId,
      );
      const targetPhase = updatedChecklist.phases.find(
        (phase: any) => phase.id === targetPhaseId,
      );

      expect(sourcePhase.items).toEqual([]);
      expect(targetPhase.items).toEqual([
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
      const checklist = await checklistTestManager.getChecklist(accessToken);
      const phaseId = checklist.phases[0].id;

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
      const checklist = await checklistTestManager.getChecklist(accessToken);
      const sourcePhaseId = checklist.phases[0].id;
      const targetPhaseId = checklist.phases[1].id;
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
