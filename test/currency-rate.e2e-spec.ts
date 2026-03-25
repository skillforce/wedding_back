import { HttpStatus, INestApplication } from '@nestjs/common';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { initTesting } from './helpers/initTesting';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { CurrencyRateTestManager } from './helpers/currency-rate.test-manager';
import { CurrencyRefreshService } from '../src/modules/currency/app/services/currency-refresh.service';
import { CurrencyRateQueryRepository } from '../src/modules/currency/infra/query/currency-rate.query-repository';
import { getOptionsToken } from '@nestjs/throttler';

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

  it('should have fetched rates on module init (onModuleInit)', async () => {
    const queryRepository = app.get<CurrencyRateQueryRepository>(CurrencyRateQueryRepository);
    const latest = await queryRepository.findLatest();

    expect(latest).not.toBeNull();
    expect(latest!.base).toBe('USD');
    expect(latest!.rates.BYN).toBeGreaterThan(0);
    expect(latest!.rates.RUB).toBeGreaterThan(0);
  });

  it('should fetch fresh rates when refreshRates is called', async () => {
    const currencyRefreshService = app.get<CurrencyRefreshService>(CurrencyRefreshService);
    const fetchSpy = jest.spyOn(global, 'fetch');

    await currencyRefreshService.refreshRates();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('exchangerate-api.com'),
    );
    fetchSpy.mockRestore();
  });

  it('should return currency rates', async () => {
    const { accessToken } =
      await userAccountsTestManager.createUserAndLogin();

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

  it('should return rates with positive values', async () => {
    const { accessToken } =
      await userAccountsTestManager.createUserAndLogin();

    const rates = await currencyRateTestManager.getRates(accessToken);

    expect(rates.rates.BYN).toBeGreaterThan(0);
    expect(rates.rates.RUB).toBeGreaterThan(0);
  });

  it('should return 401 without auth', async () => {
    await currencyRateTestManager.getRates(
      'invalid-token',
      HttpStatus.UNAUTHORIZED,
    );
  });
});