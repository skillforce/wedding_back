import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { initAppModule } from '../../src/init-app-module';
import { CoreConfig } from '../../src/core/configs/core.config';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from './delete-all-data';
import { UserAccountsTestManager } from './user-acounts.test-manager';
import { GuestsTestManager } from './guests.test-manager';
import { SeatingTablesTestManager } from './seating-tables.test-manager';
import { SeatingSeatsTestManager } from './seating-seats.test-manager';
import { BudgetTestManager } from './budget/budget.test-manager';
import { BudgetSectionsTestManager } from './budget/budget-sections.test-manager';
import { BudgetItemsTestManager } from './budget/budget-items.test-manager';

export const initTesting = async (
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
  const DynamicAppModule = await initAppModule();
  const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [DynamicAppModule],
  });

  if (addSettingsToModuleBuilder) {
    addSettingsToModuleBuilder(testingModuleBuilder);
  }

  const testingAppModule = await testingModuleBuilder.compile();

  const app = testingAppModule.createNestApplication();

  const coreConfig = app.get<CoreConfig>(CoreConfig);
  appSetup(app, coreConfig);

  await app.init();

  const httpServer = app.getHttpServer();
  const userAccountsTestManager = new UserAccountsTestManager(app);
  const guestsTestManager = new GuestsTestManager(app);
  const seatingTablesTestManager = new SeatingTablesTestManager(app);
  const seatingSeatsTestManager = new SeatingSeatsTestManager(app);
  const budgetTestManager = new BudgetTestManager(app);
  const budgetSectionsTestManager = new BudgetSectionsTestManager(app);
  const budgetItemsTestManager = new BudgetItemsTestManager(app);

  await deleteAllData(app);

  return {
    app,
    httpServer,
    userAccountsTestManager,
    guestsTestManager,
    seatingTablesTestManager,
    seatingSeatsTestManager,
    budgetTestManager,
    budgetSectionsTestManager,
    budgetItemsTestManager,
  };
};
