import { HttpStatus, INestApplication } from '@nestjs/common';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { initTesting } from './helpers/initTesting';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { BudgetTestManager } from './helpers/budget/budget.test-manager';
import { BudgetSectionsTestManager } from './helpers/budget/budget-sections.test-manager';
import { BudgetItemsTestManager } from './helpers/budget/budget-items.test-manager';
import { getOptionsToken } from '@nestjs/throttler';
import { BaseCurrency } from '../src/modules/currency/domain/entities/base-currency.enum';

describe('Budget (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;
  let budgetTestManager: BudgetTestManager;
  let budgetSectionsTestManager: BudgetSectionsTestManager;
  let budgetItemsTestManager: BudgetItemsTestManager;

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
    budgetTestManager = result.budgetTestManager;
    budgetSectionsTestManager = result.budgetSectionsTestManager;
    budgetItemsTestManager = result.budgetItemsTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Budget', () => {
    it('should auto-create a default budget when a new user registers', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const budget = await budgetTestManager.getBudget(accessToken);

      expect(budget).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          budgetLimit: 0,
          currency: 'BYN',
          sections: [],
        }),
      );
    });

    it('should update budget limit', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const budget = await budgetTestManager.updateBudget(
        { budgetLimit: 500000 },
        accessToken,
      );

      expect(budget.budgetLimit).toBe(500000);
    });

    it('should update budget currency', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const budget = await budgetTestManager.updateBudget(
        { currency: 'USD' as any },
        accessToken,
      );

      expect(budget.currency).toBe('USD');
    });

    it('should return 401 without auth', async () => {
      await budgetTestManager.getBudget(
        'invalid-token',
        HttpStatus.UNAUTHORIZED,
      );
    });
  });

  describe('Sections', () => {
    it('should create a section and see it in budget', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const budget = await budgetSectionsTestManager.createSection(
        { name: 'Организация' },
        accessToken,
      );

      expect(budget.sections).toHaveLength(1);
      expect(budget.sections[0]).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: 'Организация',
          sortOrder: 0,
          items: [],
        }),
      );
    });

    it('should reorder sections within the budget', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await budgetSectionsTestManager.createSection(
        { name: 'Section A' },
        accessToken,
      );
      await budgetSectionsTestManager.createSection(
        { name: 'Section B' },
        accessToken,
      );
      const created = await budgetSectionsTestManager.createSection(
        { name: 'Section C' },
        accessToken,
      );
      const sectionAId = created.sections.find(
        (section: any) => section.name === 'Section A',
      ).id;

      const moved = await budgetSectionsTestManager.moveSection(
        {
          sectionId: sectionAId,
          targetIndex: 2,
        },
        accessToken,
      );

      expect(moved).toHaveLength(3);
      expect(moved.map((section: any) => section.name)).toEqual([
        'Section B',
        'Section C',
        'Section A',
      ]);
      expect(moved.map((section: any) => section.sortOrder)).toEqual([0, 1, 2]);
    });

    it('should update section name', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const created = await budgetSectionsTestManager.createSection(
        { name: 'Old Name' },
        accessToken,
      );
      const sectionId = created.sections[0].id;

      const updated = await budgetSectionsTestManager.updateSection(
        sectionId,
        { name: 'New Name' },
        accessToken,
      );

      expect(updated.sections[0].name).toBe('New Name');
    });

    it('should delete a section', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const created = await budgetSectionsTestManager.createSection(
        budgetSectionsTestManager.buildCreateSectionDto(),
        accessToken,
      );
      const sectionId = created.sections[0].id;

      await budgetSectionsTestManager.deleteSection(sectionId, accessToken);

      const budget = await budgetTestManager.getBudget(accessToken);
      expect(budget.sections).toHaveLength(0);
    });

    it('should delete section and cascade delete its items', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'To Delete' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      await budgetItemsTestManager.createItem(
        budgetItemsTestManager.buildCreateItemDto(sectionId),
        accessToken,
      );
      await budgetItemsTestManager.createItem(
        budgetItemsTestManager.buildCreateItemDto(sectionId),
        accessToken,
      );

      await budgetSectionsTestManager.deleteSection(sectionId, accessToken);

      const budget = await budgetTestManager.getBudget(accessToken);
      expect(budget.sections).toHaveLength(0);
    });

    it('should return 404 when updating non-existing section', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await budgetSectionsTestManager.updateSection(
        999999,
        { name: 'Nope' },
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it('should return 404 when deleting non-existing section', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await budgetSectionsTestManager.deleteSection(
        999999,
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it('should return 409 when exceeding 30 sections per budget', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      for (let i = 0; i < 30; i++) {
        await budgetSectionsTestManager.createSection(
          { name: `Section ${i}` },
          accessToken,
        );
      }

      await budgetSectionsTestManager.createSection(
        { name: 'Section 31' },
        accessToken,
        HttpStatus.CONFLICT,
      );
    });

    it("should not allow accessing another user's section", async () => {
      const { accessToken: tokenA } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } =
        await userAccountsTestManager.createUserAndLogin();

      const budget = await budgetSectionsTestManager.createSection(
        { name: 'User A Section' },
        tokenA,
      );
      const sectionId = budget.sections[0].id;

      await budgetSectionsTestManager.updateSection(
        sectionId,
        { name: 'Hacked' },
        tokenB,
        HttpStatus.FORBIDDEN,
      );

      await budgetSectionsTestManager.deleteSection(
        sectionId,
        tokenB,
        HttpStatus.FORBIDDEN,
      );

      await budgetSectionsTestManager.moveSection(
        {
          sectionId,
          targetIndex: 0,
        },
        tokenB,
        HttpStatus.FORBIDDEN,
      );
    });
  });

  describe('Items', () => {
    it('should create an item with defaults', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'Банкет' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      const budget = await budgetItemsTestManager.createItem(
        { sectionId, name: 'Аренда зала' },
        accessToken,
      );

      const item = budget.sections[0].items[0];
      expect(item).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: 'Аренда зала',
          sortOrder: 0,
          estimatedCost: 0,
          actualCost: null,
          deposit: null,
          currency: 'USD',
          priority: 'must',
          paid: false,
        }),
      );
    });

    it('should create an item with all fields', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'Организация' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      const budget = await budgetItemsTestManager.createItem(
        {
          sectionId,
          name: 'Ведущий',
          estimatedCost: 50000,
          priority: 'must' as any,
        },
        accessToken,
      );

      const item = budget.sections[0].items[0];
      expect(item.name).toBe('Ведущий');
      expect(item.estimatedCost).toBe(50000);
      expect(item.priority).toBe('must');
    });

    it('should update item fields', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'Test' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      const created = await budgetItemsTestManager.createItem(
        budgetItemsTestManager.buildCreateItemDto(sectionId),
        accessToken,
      );
      const itemId = created.sections[0].items[0].id;

      const updated = await budgetItemsTestManager.updateItem(
        itemId,
        {
          name: 'Updated',
          estimatedCost: 100000,
          actualCost: 90000,
          priority: 'want' as any,
          paid: true,
        },
        accessToken,
      );

      const item = updated.sections[0].items[0];
      expect(item.name).toBe('Updated');
      expect(item.estimatedCost).toBe(100000);
      expect(item.actualCost).toBe(90000);
      expect(item.priority).toBe('want');
      expect(item.paid).toBe(true);
    });

    it('should set actualCost to null', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'Test' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      const created = await budgetItemsTestManager.createItem(
        budgetItemsTestManager.buildCreateItemDto(sectionId),
        accessToken,
      );
      const itemId = created.sections[0].items[0].id;

      await budgetItemsTestManager.updateItem(
        itemId,
        { actualCost: 50000 },
        accessToken,
      );

      const cleared = await budgetItemsTestManager.updateItem(
        itemId,
        { actualCost: null },
        accessToken,
      );

      expect(cleared.sections[0].items[0].actualCost).toBeNull();
    });

    it('should update deposit on an item', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'Test' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      const created = await budgetItemsTestManager.createItem(
        budgetItemsTestManager.buildCreateItemDto(sectionId),
        accessToken,
      );
      const itemId = created.sections[0].items[0].id;

      const updated = await budgetItemsTestManager.updateItem(
        itemId,
        { deposit: 15000 },
        accessToken,
      );

      expect(updated.sections[0].items[0].deposit).toBe(15000);
    });

    it('should set deposit to null', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'Test' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      const created = await budgetItemsTestManager.createItem(
        budgetItemsTestManager.buildCreateItemDto(sectionId),
        accessToken,
      );
      const itemId = created.sections[0].items[0].id;

      await budgetItemsTestManager.updateItem(
        itemId,
        { deposit: 15000 },
        accessToken,
      );

      const cleared = await budgetItemsTestManager.updateItem(
        itemId,
        { deposit: null },
        accessToken,
      );

      expect(cleared.sections[0].items[0].deposit).toBeNull();
    });

    it('should set item currency', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'Test' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      const created = await budgetItemsTestManager.createItem(
        budgetItemsTestManager.buildCreateItemDto(sectionId),
        accessToken,
      );
      const itemId = created.sections[0].items[0].id;

      const updated = await budgetItemsTestManager.updateItem(
        itemId,
        { currency: 'USD' as any },
        accessToken,
      );

      expect(updated.sections[0].items[0].currency).toBe('USD');
    });

    it('should create an item with a specific currency', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'Test' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      const budget = await budgetItemsTestManager.createItem(
        { sectionId, name: 'Item with currency' },
        accessToken,
      );

      expect(budget.sections[0].items[0].currency).toBe('USD');
    });

    it('should return 400 when deposit is not an integer', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'Test' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      const created = await budgetItemsTestManager.createItem(
        budgetItemsTestManager.buildCreateItemDto(sectionId),
        accessToken,
      );
      const itemId = created.sections[0].items[0].id;

      await budgetItemsTestManager.updateItem(
        itemId,
        { deposit: 'not-a-number' as any },
        accessToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    });

    it('should delete an item', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'Test' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      const created = await budgetItemsTestManager.createItem(
        budgetItemsTestManager.buildCreateItemDto(sectionId),
        accessToken,
      );
      const itemId = created.sections[0].items[0].id;

      await budgetItemsTestManager.deleteItem(itemId, accessToken);

      const budget = await budgetTestManager.getBudget(accessToken);
      expect(budget.sections[0].items).toHaveLength(0);
    });

    it('should reorder items within the same section', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'Test' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      await budgetItemsTestManager.createItem(
        { sectionId, name: 'Item A' },
        accessToken,
      );
      await budgetItemsTestManager.createItem(
        { sectionId, name: 'Item B' },
        accessToken,
      );
      const created = await budgetItemsTestManager.createItem(
        { sectionId, name: 'Item C' },
        accessToken,
      );
      const itemAId = created.sections[0].items.find(
        (item: any) => item.name === 'Item A',
      ).id;

      const moved = await budgetItemsTestManager.moveItem(
        {
          itemId: itemAId,
          targetSectionId: sectionId,
          targetIndex: 2,
        },
        accessToken,
      );

      expect(moved).toHaveLength(1);
      expect(moved[0].id).toBe(sectionId);
      expect(moved[0].items.map((item: any) => item.name)).toEqual([
        'Item B',
        'Item C',
        'Item A',
      ]);
      expect(moved[0].items.map((item: any) => item.sortOrder)).toEqual([
        0, 1, 2,
      ]);
    });

    it('should move an item to another section', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await budgetSectionsTestManager.createSection(
        { name: 'Source' },
        accessToken,
      );
      const withTargetSection = await budgetSectionsTestManager.createSection(
        { name: 'Target' },
        accessToken,
      );
      const sourceSectionId = withTargetSection.sections.find(
        (section: any) => section.name === 'Source',
      ).id;
      const targetSectionId = withTargetSection.sections.find(
        (section: any) => section.name === 'Target',
      ).id;

      const created = await budgetItemsTestManager.createItem(
        {
          sectionId: sourceSectionId,
          name: 'Move me',
        },
        accessToken,
      );
      const itemId = created.sections.find(
        (section: any) => section.id === sourceSectionId,
      ).items[0].id;

      const moved = await budgetItemsTestManager.moveItem(
        {
          itemId,
          targetSectionId,
          targetIndex: 0,
        },
        accessToken,
      );

      expect(moved).toHaveLength(2);
      const sourceSection = moved.find(
        (section: any) => section.id === sourceSectionId,
      );
      const targetSection = moved.find(
        (section: any) => section.id === targetSectionId,
      );

      expect(sourceSection.items).toEqual([]);
      expect(targetSection.items).toEqual([
        expect.objectContaining({
          id: itemId,
          name: 'Move me',
          sortOrder: 0,
        }),
      ]);
    });

    it('should return 404 when updating non-existing item', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await budgetItemsTestManager.updateItem(
        999999,
        { name: 'Nope' },
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it('should return 404 when deleting non-existing item', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await budgetItemsTestManager.deleteItem(
        999999,
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it('should return 409 when exceeding 20 items per section', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'Full Section' },
        accessToken,
      );
      const sectionId = withSection.sections[0].id;

      for (let i = 0; i < 20; i++) {
        await budgetItemsTestManager.createItem(
          { sectionId, name: `Item ${i}` },
          accessToken,
        );
      }

      await budgetItemsTestManager.createItem(
        { sectionId, name: 'Item 21' },
        accessToken,
        HttpStatus.CONFLICT,
      );
    });

    it('should reject moving an item into a full target section', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await budgetSectionsTestManager.createSection(
        { name: 'Source' },
        accessToken,
      );
      const withTargetSection = await budgetSectionsTestManager.createSection(
        { name: 'Target' },
        accessToken,
      );
      const sourceSectionId = withTargetSection.sections.find(
        (section: any) => section.name === 'Source',
      ).id;
      const targetSectionId = withTargetSection.sections.find(
        (section: any) => section.name === 'Target',
      ).id;

      const sourceBudget = await budgetItemsTestManager.createItem(
        { sectionId: sourceSectionId, name: 'Move blocked' },
        accessToken,
      );
      const itemId = sourceBudget.sections.find(
        (section: any) => section.id === sourceSectionId,
      ).items[0].id;

      for (let index = 0; index < 20; index += 1) {
        await budgetItemsTestManager.createItem(
          { sectionId: targetSectionId, name: `Target ${index}` },
          accessToken,
        );
      }

      const response = await budgetItemsTestManager.moveItem(
        {
          itemId,
          targetSectionId,
          targetIndex: 20,
        },
        accessToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      expect(response).toEqual({
        errorsMessages: [
          {
            field: 'targetSectionId',
            message: 'Maximum of 20 items per section reached',
          },
        ],
      });
    });

    it("should not allow accessing another user's item", async () => {
      const { accessToken: tokenA } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } =
        await userAccountsTestManager.createUserAndLogin();

      const withSection = await budgetSectionsTestManager.createSection(
        { name: 'User A Section' },
        tokenA,
      );
      const sectionId = withSection.sections[0].id;

      const created = await budgetItemsTestManager.createItem(
        budgetItemsTestManager.buildCreateItemDto(sectionId),
        tokenA,
      );
      const itemId = created.sections[0].items[0].id;

      await budgetItemsTestManager.updateItem(
        itemId,
        { name: 'Hacked' },
        tokenB,
        HttpStatus.FORBIDDEN,
      );

      await budgetItemsTestManager.deleteItem(
        itemId,
        tokenB,
        HttpStatus.FORBIDDEN,
      );

      await budgetItemsTestManager.moveItem(
        {
          itemId,
          targetSectionId: sectionId,
          targetIndex: 0,
        },
        tokenB,
        HttpStatus.FORBIDDEN,
      );
    });
  });
});
