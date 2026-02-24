import { HttpStatus, INestApplication } from '@nestjs/common';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { initTesting } from './helpers/initTesting';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { SeatingTablesTestManager } from './helpers/seating-tables.test-manager';
import { SeatingSeatsTestManager } from './helpers/seating-seats.test-manager';
import { getOptionsToken } from '@nestjs/throttler';

describe('SeatingTablesController & SeatingSeatsController (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;
  let seatingTablesTestManager: SeatingTablesTestManager;
  let seatingSeatsTestManager: SeatingSeatsTestManager;

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
    seatingTablesTestManager = result.seatingTablesTestManager;
    seatingSeatsTestManager = result.seatingSeatsTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // ─── Tables ───────────────────────────────────────────────────────────────

  describe('Tables', () => {
    it('should create a table and return it', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const dto = seatingTablesTestManager.buildCreateTableDto({ name: 'Main Table' });

      const created = await seatingTablesTestManager.createTable(dto, accessToken);

      expect(created).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Main Table',
          position: dto.position,
          shape: 'circle',
          rotation: 0,
          seats: [],
        }),
      );
    });

    it('should return 401 when creating table without auth', async () => {
      const dto = seatingTablesTestManager.buildCreateTableDto();
      await seatingTablesTestManager.createTable(dto, 'invalid-token', HttpStatus.UNAUTHORIZED);
    });

    it('should return all tables for the authenticated user', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const dto1 = seatingTablesTestManager.buildCreateTableDto({ name: 'Table A' });
      const dto2 = seatingTablesTestManager.buildCreateTableDto({ name: 'Table B' });

      await seatingTablesTestManager.createTable(dto1, accessToken);
      await seatingTablesTestManager.createTable(dto2, accessToken);

      const tables = await seatingTablesTestManager.getAllTables(accessToken);

      expect(tables).toHaveLength(2);
      expect(tables).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Table A' }),
          expect.objectContaining({ name: 'Table B' }),
        ]),
      );
    });

    it('should not return tables of another user', async () => {
      const { accessToken: tokenA } = await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } = await userAccountsTestManager.createUserAndLogin();

      await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto({ name: 'User A Table' }),
        tokenA,
      );

      const tablesB = await seatingTablesTestManager.getAllTables(tokenB);
      expect(tablesB).toHaveLength(0);
    });

    it('should update table name', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto({ name: 'Old Name' }),
        accessToken,
      );

      const updated = await seatingTablesTestManager.updateTable(
        created.id,
        { name: 'New Name' },
        accessToken,
      );

      expect(updated.name).toBe('New Name');
    });

    it('should update table position', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto({ position: { x: 0, y: 0 } }),
        accessToken,
      );

      const updated = await seatingTablesTestManager.updateTable(
        created.id,
        { position: { x: 150, y: 250 } },
        accessToken,
      );

      expect(updated.position).toEqual({ x: 150, y: 250 });
    });

    it('should update table rotation', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );

      const updated = await seatingTablesTestManager.updateTable(
        created.id,
        { rotation: 90 },
        accessToken,
      );

      expect(updated.rotation).toBe(90);
    });

    it('should update table shape', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto({ shape: 'circle' }),
        accessToken,
      );

      const updated = await seatingTablesTestManager.updateTable(
        created.id,
        { shape: 'rect' },
        accessToken,
      );

      expect(updated.shape).toBe('rect');
    });

    it('should return 403 when updating another user\'s table', async () => {
      const { accessToken: tokenA } = await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } = await userAccountsTestManager.createUserAndLogin();

      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        tokenA,
      );

      await seatingTablesTestManager.updateTable(
        created.id,
        { name: 'Hacked' },
        tokenB,
        HttpStatus.FORBIDDEN,
      );
    });

    it('should delete a table', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );

      await seatingTablesTestManager.deleteTable(created.id, accessToken);

      const tables = await seatingTablesTestManager.getAllTables(accessToken);
      expect(tables).toHaveLength(0);
    });

    it('should return 404 when deleting a non-existing table', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const nonExistingId = '00000000-0000-0000-0000-000000000000';

      await seatingTablesTestManager.deleteTable(nonExistingId, accessToken, HttpStatus.NOT_FOUND);
    });

    it('should return 403 when deleting another user\'s table', async () => {
      const { accessToken: tokenA } = await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } = await userAccountsTestManager.createUserAndLogin();

      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        tokenA,
      );

      await seatingTablesTestManager.deleteTable(created.id, tokenB, HttpStatus.FORBIDDEN);
    });
  });

  // ─── Seats ────────────────────────────────────────────────────────────────

  describe('Seats', () => {
    it('should create a seat for a table', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );

      const seat = await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto({ name: 'Seat A1' }),
        accessToken,
      );

      expect(seat).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Seat A1',
        }),
      );
    });

    it('should return 404 when creating seat for non-existing table', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const nonExistingTableId = '00000000-0000-0000-0000-000000000000';

      await seatingSeatsTestManager.createSeat(
        nonExistingTableId,
        seatingSeatsTestManager.buildCreateSeatDto(),
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it('should return 403 when creating seat on another user\'s table', async () => {
      const { accessToken: tokenA } = await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } = await userAccountsTestManager.createUserAndLogin();

      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        tokenA,
      );

      await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto(),
        tokenB,
        HttpStatus.FORBIDDEN,
      );
    });

    it('should delete a seat', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );
      const seat = await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto(),
        accessToken,
      );

      await seatingSeatsTestManager.deleteSeat(table.id, seat.id, accessToken);

      const tables = await seatingTablesTestManager.getAllTables(accessToken);
      expect(tables[0].seats).toHaveLength(0);
    });

    it('should return 404 when deleting a non-existing seat', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );
      const nonExistingSeatId = '00000000-0000-0000-0000-000000000000';

      await seatingSeatsTestManager.deleteSeat(
        table.id,
        nonExistingSeatId,
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it('should return 403 when deleting a seat from another user\'s table', async () => {
      const { accessToken: tokenA } = await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } = await userAccountsTestManager.createUserAndLogin();

      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        tokenA,
      );
      const seat = await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto(),
        tokenA,
      );

      await seatingSeatsTestManager.deleteSeat(
        table.id,
        seat.id,
        tokenB,
        HttpStatus.FORBIDDEN,
      );
    });

    it('should delete table and cascade delete its seats', async () => {
      const { accessToken } = await userAccountsTestManager.createUserAndLogin();
      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );

      await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto(),
        accessToken,
      );
      await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto(),
        accessToken,
      );

      await seatingTablesTestManager.deleteTable(table.id, accessToken);

      const tables = await seatingTablesTestManager.getAllTables(accessToken);
      expect(tables).toHaveLength(0);
    });
  });
});