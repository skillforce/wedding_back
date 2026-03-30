import { HttpStatus, INestApplication } from '@nestjs/common';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { initTesting } from './helpers/initTesting';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { CurrencyRateTestManager } from './helpers/currency-rate.test-manager';
import { CurrencyRefreshService } from '../src/modules/currency/app/services/currency-refresh.service';
import { getOptionsToken } from '@nestjs/throttler';

const mockRatesResponse = {
  result: 'success',
  base_code: 'USD',
  conversion_rates: {
    BYN: 3.27,
    RUB: 96.5,
  },
};

describe('Currency Rate (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;
  let currencyRateTestManager: CurrencyRateTestManager;
  let fetchSpy: jest.SpyInstance;

  beforeAll(async () => {
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockRatesResponse,
    } as Response);

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
    fetchSpy.mockClear();
  });

  afterAll(async () => {
    fetchSpy.mockRestore();
    if (app) {
      await app.close();
    }
  });

  it('should call fetch when refreshRates is invoked', async () => {
    const currencyRefreshService = app.get<CurrencyRefreshService>(
      CurrencyRefreshService,
    );

    await currencyRefreshService.refreshRates();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('exchangerate'),
    );
  });

  it('should return currency rates from mocked data', async () => {
    const { accessToken } = await userAccountsTestManager.createUserAndLogin();

    const rates = await currencyRateTestManager.getRates(accessToken);

    expect(rates).toEqual(
      expect.objectContaining({
        base: 'USD',
        rates: expect.objectContaining({
          BYN: expect.any(Number),
          RUB: expect.any(Number),
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
