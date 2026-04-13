import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { initAppModule } from '../../src/init-app-module';
import { CoreConfig } from '../../src/core/configs/core.config';
import { appSetup } from '../../src/setup/app.setup';
import { deleteAllData } from './delete-all-data';
import { UserAccountsTestManager } from './user-acounts.test-manager';
import { ResendAdapter } from '../../src/modules/email/resend.adapter';
import { GuestsTestManager } from './guests.test-manager';
import { SeatingTablesTestManager } from './seating-tables.test-manager';
import { SeatingSeatsTestManager } from './seating-seats.test-manager';
import { BudgetTestManager } from './budget/budget.test-manager';
import { BudgetSectionsTestManager } from './budget/budget-sections.test-manager';
import { BudgetItemsTestManager } from './budget/budget-items.test-manager';
import { ChecklistTestManager } from './checklist/checklist.test-manager';
import { CurrencyRateTestManager } from './currency-rate.test-manager';
import { ProfileTestManager } from './profile.test-manager';
import { CurrencyRateQueryRepository } from '../../src/modules/currency/infra/query/currency-rate.query-repository';
import { CurrencyRateViewDto } from '../../src/modules/currency/api/view-dto/currency-rate.view-dto';
import { BaseCurrency } from '../../src/modules/currency/domain/entities/base-currency.enum';

class MockCurrencyRateQueryRepository {
  async findLatest(): Promise<CurrencyRateViewDto> {
    const dto = new CurrencyRateViewDto();
    dto.base = BaseCurrency.USD;
    dto.rates = { BYN: 3.27, RUB: 96.5 };
    dto.updatedAt = new Date().toISOString();
    return dto;
  }
}

export const initTesting = async (
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
  const DynamicAppModule = await initAppModule();
  const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [DynamicAppModule],
  });

  const mockResendAdapter = { send: jest.fn().mockResolvedValue(undefined) };

  testingModuleBuilder
    .overrideProvider(CurrencyRateQueryRepository)
    .useClass(MockCurrencyRateQueryRepository);

  testingModuleBuilder
    .overrideProvider(ResendAdapter)
    .useValue(mockResendAdapter);

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
  const checklistTestManager = new ChecklistTestManager(app);
  const currencyRateTestManager = new CurrencyRateTestManager(app);
  const profileTestManager = new ProfileTestManager(app);

  await deleteAllData(app);

  return {
    app,
    httpServer,
    mockResendAdapter,
    userAccountsTestManager,
    guestsTestManager,
    seatingTablesTestManager,
    seatingSeatsTestManager,
    budgetTestManager,
    budgetSectionsTestManager,
    budgetItemsTestManager,
    checklistTestManager,
    currencyRateTestManager,
    profileTestManager,
  };
};
