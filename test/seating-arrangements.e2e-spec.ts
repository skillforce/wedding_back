import { HttpStatus, INestApplication } from '@nestjs/common';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { initTesting } from './helpers/initTesting';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { SeatingTablesTestManager } from './helpers/seating-tables.test-manager';
import { SeatingSeatsTestManager } from './helpers/seating-seats.test-manager';
import { GuestsTestManager } from './helpers/guests.test-manager';
import { getOptionsToken } from '@nestjs/throttler';

describe('SeatingTablesController & SeatingSeatsController (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;
  let seatingTablesTestManager: SeatingTablesTestManager;
  let seatingSeatsTestManager: SeatingSeatsTestManager;
  let guestsTestManager: GuestsTestManager;

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
    guestsTestManager = result.guestsTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should create a default seating arrangement when a new user registers', async () => {
    const { accessToken } = await userAccountsTestManager.createUserAndLogin();

    const arrangement =
      await seatingTablesTestManager.getAllTables(accessToken);
    expect(arrangement).toEqual(
      expect.objectContaining({
        shape: 'rect',
        width: 1600,
        height: 900,
        max_tables_amount: 20,
        max_seats_per_table_amount: 8,
        items: [],
      }),
    );
  });

  describe('Tables', () => {
    it('should create a table and return it', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const dto = seatingTablesTestManager.buildCreateTableDto({
        name: 'Main Table',
      });

      const created = await seatingTablesTestManager.createTable(
        dto,
        accessToken,
      );

      expect(created).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Main Table',
          position: dto.position,
          shape: 'circle',
          rotation: 0,
          radius: 70,
          seats: [],
        }),
      );
    });

    it('should return 401 when creating table without auth', async () => {
      const dto = seatingTablesTestManager.buildCreateTableDto();
      await seatingTablesTestManager.createTable(
        dto,
        'invalid-token',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should return all tables for the authenticated user', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const dto1 = seatingTablesTestManager.buildCreateTableDto({
        name: 'Table A',
      });
      const dto2 = seatingTablesTestManager.buildCreateTableDto({
        name: 'Table B',
      });

      await seatingTablesTestManager.createTable(dto1, accessToken);
      await seatingTablesTestManager.createTable(dto2, accessToken);

      const arrangement =
        await seatingTablesTestManager.getAllTables(accessToken);

      expect(arrangement.items).toHaveLength(2);
      expect(arrangement.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Table A' }),
          expect.objectContaining({ name: 'Table B' }),
        ]),
      );
    });

    it('should not return tables of another user', async () => {
      const { accessToken: tokenA } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } =
        await userAccountsTestManager.createUserAndLogin();

      await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto({ name: 'User A Table' }),
        tokenA,
      );

      const arrangementB = await seatingTablesTestManager.getAllTables(tokenB);
      expect(arrangementB.items).toHaveLength(0);
    });

    it('should update table name', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
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
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto({
          position: { x: 0, y: 0 },
        }),
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
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
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
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
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

    it('should create a table with pillar shape', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const dto = seatingTablesTestManager.buildCreateTableDto({
        name: 'Pillar',
        shape: 'pillar',
      });

      const created = await seatingTablesTestManager.createTable(
        dto,
        accessToken,
      );

      expect(created.shape).toBe('pillar');
    });

    it('should update table shape to pillar', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto({ shape: 'circle' }),
        accessToken,
      );

      const updated = await seatingTablesTestManager.updateTable(
        created.id,
        { shape: 'pillar' },
        accessToken,
      );

      expect(updated.shape).toBe('pillar');
    });

    it('should create a table with custom radius', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const dto = seatingTablesTestManager.buildCreateTableDto({ radius: 100 });

      const created = await seatingTablesTestManager.createTable(
        dto,
        accessToken,
      );

      expect(created.radius).toBe(100);
    });

    it('should update table radius', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );

      const updated = await seatingTablesTestManager.updateTable(
        created.id,
        { radius: 80 },
        accessToken,
      );

      expect(updated.radius).toBe(80);
    });

    it('should default radius to 70 when not provided', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );

      expect(created.radius).toBe(70);
    });

    it("should return 403 when updating another user's table", async () => {
      const { accessToken: tokenA } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } =
        await userAccountsTestManager.createUserAndLogin();

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
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );

      await seatingTablesTestManager.deleteTable(created.id, accessToken);

      const arrangement =
        await seatingTablesTestManager.getAllTables(accessToken);
      expect(arrangement.items).toHaveLength(0);
    });

    it('should return 404 when deleting a non-existing table', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const nonExistingId = '00000000-0000-0000-0000-000000000000';

      await seatingTablesTestManager.deleteTable(
        nonExistingId,
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it("should return 403 when deleting another user's table", async () => {
      const { accessToken: tokenA } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } =
        await userAccountsTestManager.createUserAndLogin();

      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        tokenA,
      );

      await seatingTablesTestManager.deleteTable(
        created.id,
        tokenB,
        HttpStatus.FORBIDDEN,
      );
    });
  });

  // ─── Seats ────────────────────────────────────────────────────────────────

  describe('Seats', () => {
    it('should create a seat for a table and return guest id and name', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();
      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );
      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId, {
          guest_name: 'JohnDoe',
        }),
        accessToken,
      );

      const seat = await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto(guest.id),
        accessToken,
      );

      expect(seat).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          guest_id: guest.id,
          name: 'JohnDoe',
        }),
      );
    });

    it('should return 404 when creating seat for non-existing table', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();
      const nonExistingTableId = '00000000-0000-0000-0000-000000000000';
      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );

      await seatingSeatsTestManager.createSeat(
        nonExistingTableId,
        seatingSeatsTestManager.buildCreateSeatDto(guest.id),
        accessToken,
        HttpStatus.NOT_FOUND,
      );
    });

    it("should return 403 when creating seat on another user's table", async () => {
      const { accessToken: tokenA, userId: userIdA } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB, userId: userIdB } =
        await userAccountsTestManager.createUserAndLogin();

      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        tokenA,
      );
      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userIdB),
        tokenB,
      );

      await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto(guest.id),
        tokenB,
        HttpStatus.FORBIDDEN,
      );
    });

    it('should delete a seat', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();
      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );
      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );
      const seat = await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto(guest.id),
        accessToken,
      );

      await seatingSeatsTestManager.deleteSeat(table.id, seat.id, accessToken);

      const arrangement =
        await seatingTablesTestManager.getAllTables(accessToken);
      expect(arrangement.items[0].seats).toHaveLength(0);
    });

    it('should return 404 when deleting a non-existing seat', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
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

    it("should return 403 when deleting a seat from another user's table", async () => {
      const { accessToken: tokenA, userId: userIdA } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: tokenB } =
        await userAccountsTestManager.createUserAndLogin();

      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        tokenA,
      );
      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userIdA),
        tokenA,
      );
      const seat = await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto(guest.id),
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
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();
      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );
      const guest1 = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );
      const guest2 = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );

      await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto(guest1.id),
        accessToken,
      );
      await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto(guest2.id),
        accessToken,
      );

      await seatingTablesTestManager.deleteTable(table.id, accessToken);

      const arrangement =
        await seatingTablesTestManager.getAllTables(accessToken);
      expect(arrangement.items).toHaveLength(0);
    });

    it('should cascade delete seat when guest is deleted', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();
      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );
      const guest = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );
      await seatingSeatsTestManager.createSeat(
        table.id,
        seatingSeatsTestManager.buildCreateSeatDto(guest.id),
        accessToken,
      );

      await guestsTestManager.deleteGuestById(guest.id, accessToken);

      const arrangement =
        await seatingTablesTestManager.getAllTables(accessToken);
      expect(arrangement.items[0].seats).toHaveLength(0);
    });
  });
});
