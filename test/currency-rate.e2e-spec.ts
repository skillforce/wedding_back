import { HttpStatus, INestApplication } from '@nestjs/common';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { initTesting } from './helpers/initTesting';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { CurrencyRateTestManager } from './helpers/currency-rate.test-manager';
import { getOptionsToken } from '@nestjs/throttler';

const MOCK_RATES = { BYN: 3.27, RUB: 96.5 };

describe('Currency Rate (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;
  let currencyRateTestManager: CurrencyRateTestManager;

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
    currencyRateTestManager = result.currencyRateTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should return currency rates', async () => {
    const { accessToken } = await userAccountsTestManager.createUserAndLogin();

    const rates = await currencyRateTestManager.getRates(accessToken);

    expect(rates).toEqual(
      expect.objectContaining({
        base: 'USD',
        rates: expect.objectContaining({
          BYN: MOCK_RATES.BYN,
          RUB: MOCK_RATES.RUB,
        }),
        updatedAt: expect.any(String),
      }),
    );
  });

  it('should return 401 without auth', async () => {
    await currencyRateTestManager.getRates(
      'invalid-token',
      HttpStatus.UNAUTHORIZED,
    );
  });
});