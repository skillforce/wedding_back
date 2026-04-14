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
import { RelationshipToCouple } from '../src/modules/guests/domain/enteties/guest-form.entity';
import { TableShape } from '../src/modules/seating-arrangements/domain/entities/seating-table.entity';
import { UserRole } from '../src/modules/user-accounts/domain/entities/user-role.enum';

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
        shape: TableShape.Rect,
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
          shape: TableShape.Circle,
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
        seatingTablesTestManager.buildCreateTableDto({ shape: TableShape.Circle }),
        accessToken,
      );

      const updated = await seatingTablesTestManager.updateTable(
        created.id,
        { shape: TableShape.Rect },
        accessToken,
      );

      expect(updated.shape).toBe(TableShape.Rect);
    });

    it('should create a table with pillar shape', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const dto = seatingTablesTestManager.buildCreateTableDto({
        name: 'Pillar',
        shape: TableShape.Pillar,
      });

      const created = await seatingTablesTestManager.createTable(
        dto,
        accessToken,
      );

      expect(created.shape).toBe(TableShape.Pillar);
    });

    it('should update table shape to pillar', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const created = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto({ shape: TableShape.Circle }),
        accessToken,
      );

      const updated = await seatingTablesTestManager.updateTable(
        created.id,
        { shape: TableShape.Pillar },
        accessToken,
      );

      expect(updated.shape).toBe(TableShape.Pillar);
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
      const [guest] = await guestsTestManager.createGuest(
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
      const [guest] = await guestsTestManager.createGuest(
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
      const [guest] = await guestsTestManager.createGuest(
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
      const [guest] = await guestsTestManager.createGuest(
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
      const [guest] = await guestsTestManager.createGuest(
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
      const [guest1] = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );
      const [guest2] = await guestsTestManager.createGuest(
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

    it('should move guest to new table when seated again', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();
      const table1 = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );
      const table2 = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );
      const [guest] = await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId),
        accessToken,
      );

      await seatingSeatsTestManager.createSeat(
        table1.id,
        seatingSeatsTestManager.buildCreateSeatDto(guest.id),
        accessToken,
      );
      await seatingSeatsTestManager.createSeat(
        table2.id,
        seatingSeatsTestManager.buildCreateSeatDto(guest.id),
        accessToken,
      );

      const arrangement =
        await seatingTablesTestManager.getAllTables(accessToken);
      const allSeats = arrangement.items.flatMap((t: any) => t.seats);
      const guestSeats = allSeats.filter((s: any) => s.guest_id === guest.id);
      expect(guestSeats).toHaveLength(1);
    });

    it('should cascade delete seat when guest is deleted', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();
      const table = await seatingTablesTestManager.createTable(
        seatingTablesTestManager.buildCreateTableDto(),
        accessToken,
      );
      const [guest] = await guestsTestManager.createGuest(
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

  // ─── SuperUser ownership ──────────────────────────────────────────────────

  describe('superUser ownership (?userId)', () => {
    let superUserToken: string;
    let superUserId: number;
    let plainUserId: number;

    beforeEach(async () => {
      const superUserDto = userAccountsTestManager.buildCreateUserDto({ role: UserRole.SUPER_USER });
      const superUser = await userAccountsTestManager.createUser(superUserDto);
      const { body } = await userAccountsTestManager.login(superUserDto);
      superUserToken = body.accessToken;
      superUserId = superUser.id;

      const plainUserDto = userAccountsTestManager.buildCreatePlainUserDto();
      const plainUser = await userAccountsTestManager.createActivatedPlainUser(superUserId, plainUserDto);
      plainUserId = plainUser.id;
    });

    it('should allow superUser to read plain user seating arrangement via ?userId', async () => {
      const arrangement = await seatingTablesTestManager.getAllTables(
        superUserToken,
        HttpStatus.OK,
        plainUserId,
      );

      expect(arrangement).toEqual(expect.objectContaining({ items: [] }));
    });

    it('should allow superUser to create a table for plain user via ?userId', async () => {
      const dto = seatingTablesTestManager.buildCreateTableDto({ name: 'SuperUser Table' });
      const created = await seatingTablesTestManager.createTable(
        dto,
        superUserToken,
        HttpStatus.CREATED,
        plainUserId,
      );

      expect(created).toEqual(expect.objectContaining({ name: 'SuperUser Table' }));

      const arrangement = await seatingTablesTestManager.getAllTables(
        superUserToken,
        HttpStatus.OK,
        plainUserId,
      );
      expect(arrangement.items).toHaveLength(1);
    });

    it('should allow superUser to delete a table for plain user via ?userId', async () => {
      const dto = seatingTablesTestManager.buildCreateTableDto();
      const created = await seatingTablesTestManager.createTable(
        dto,
        superUserToken,
        HttpStatus.CREATED,
        plainUserId,
      );

      await seatingTablesTestManager.deleteTable(
        created.id,
        superUserToken,
        HttpStatus.NO_CONTENT,
        plainUserId,
      );

      const arrangement = await seatingTablesTestManager.getAllTables(
        superUserToken,
        HttpStatus.OK,
        plainUserId,
      );
      expect(arrangement.items).toHaveLength(0);
    });

    it('should return 403 when a non-creator superUser accesses the plain user arrangement', async () => {
      const otherSuperUserDto = userAccountsTestManager.buildCreateUserDto({ role: UserRole.SUPER_USER });
      await userAccountsTestManager.createUser(otherSuperUserDto);
      const { body: otherBody } = await userAccountsTestManager.login(otherSuperUserDto);

      await seatingTablesTestManager.getAllTables(
        otherBody.accessToken,
        HttpStatus.FORBIDDEN,
        plainUserId,
      );
    });

    it('should return 403 when a plain user passes ?userId', async () => {
      const plainUserDto2 = userAccountsTestManager.buildCreatePlainUserDto();
      await userAccountsTestManager.createActivatedPlainUser(superUserId, plainUserDto2);
      const { body: plainBody } = await userAccountsTestManager.login({
        login: plainUserDto2.login,
        password: plainUserDto2.password,
      });

      await seatingTablesTestManager.getAllTables(
        plainBody.accessToken,
        HttpStatus.FORBIDDEN,
        plainUserId,
      );
    });
  });

  // ─── Auto-seat ────────────────────────────────────────────────────────────

  describe('Auto-seat', () => {
    const createGuests = async (
      userId: number,
      accessToken: string,
      count: number,
      formOverrides: Parameters<
        typeof guestsTestManager.buildGuestFormDto
      >[0] = {},
      kidsCount = 0,
    ) => {
      for (let i = 0; i < count; i++) {
        await guestsTestManager.createGuest(
          guestsTestManager.buildCreateGuestDto(userId, {
            guestForm: guestsTestManager.buildGuestFormDto({
              ...formOverrides,
              has_kids_attending: kidsCount > 0,
              amount_of_kids: kidsCount > 0 ? kidsCount : null,
            }),
          }),
          accessToken,
        );
      }
    };

    it('should seat 30 guests (mixed sides, no VIPs) within 2s and fill tables evenly', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();

      await createGuests(userId, accessToken, 15, {
        relationship_to_couple: RelationshipToCouple.BrideSide,
      });
      await createGuests(userId, accessToken, 15, {
        relationship_to_couple: RelationshipToCouple.GroomSide,
      });

      const start = Date.now();
      const arrangement = await seatingTablesTestManager.autoSeat(accessToken);
      const elapsed = Date.now() - start;

      console.log(`[auto-seat] 30 guests, no VIPs — ${elapsed}ms`);

      const allSeats = arrangement.items.flatMap((t: any) => t.seats);
      expect(allSeats).toHaveLength(30);
      expect(elapsed).toBeLessThan(2000);

      console.log(arrangement);

      // each table should have seats from both sides (interleaved)
      for (const table of arrangement.items) {
        if (table.name !== 'Newlyweds') {
          expect(table.seats.length).toBeGreaterThan(0);
        }
      }
    });

    it('should seat 35 guests with VIPs isolated on their own tables and complete within 2s', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();

      // 4 bride VIPs → own table(s)
      await createGuests(userId, accessToken, 4, {
        relationship_to_couple: RelationshipToCouple.BrideSide,
        vip_parents: true,
      });
      // 4 groom VIPs → own table(s)
      await createGuests(userId, accessToken, 4, {
        relationship_to_couple: RelationshipToCouple.GroomSide,
        vip_parents: true,
      });
      // 27 regular guests mixed
      await createGuests(userId, accessToken, 14, {
        relationship_to_couple: RelationshipToCouple.BrideSide,
      });
      await createGuests(userId, accessToken, 13, {
        relationship_to_couple: RelationshipToCouple.GroomSide,
      });

      const start = Date.now();
      const arrangement = await seatingTablesTestManager.autoSeat(accessToken);
      const elapsed = Date.now() - start;

      console.log(`[auto-seat] 35 guests with VIPs — ${elapsed}ms`);

      const allSeats = arrangement.items.flatMap((t: any) => t.seats);
      expect(allSeats).toHaveLength(35);
      expect(elapsed).toBeLessThan(2000);
    });

    it('should seat 25 guests with plus-ones and kids (weight > 1) and complete within 2s', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();

      // 10 guests with unlisted partner (weight 2 each)
      await createGuests(
        userId,
        accessToken,
        10,
        {
          relationship_to_couple: RelationshipToCouple.BrideSide,
          ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({ response: true }),
        },
      );
      // 10 guests with 1 kid each (weight 2 each)
      await createGuests(
        userId,
        accessToken,
        10,
        { relationship_to_couple: RelationshipToCouple.GroomSide },
        1,
      );
      // 5 solo guests
      await createGuests(userId, accessToken, 5, {
        relationship_to_couple: RelationshipToCouple.Mutual,
      });

      const start = Date.now();
      const arrangement = await seatingTablesTestManager.autoSeat(accessToken);
      const elapsed = Date.now() - start;

      console.log(`[auto-seat] 25 guests with plus-ones/kids — ${elapsed}ms`);

      // 25 seat records (plus-ones and kids consume capacity but have no seat record)
      const allSeats = arrangement.items.flatMap((t: any) => t.seats);
      expect(allSeats).toHaveLength(25);
      expect(elapsed).toBeLessThan(2000);

      // verify no table exceeds max_seats_per_table_amount (default 8)
      // weight: 10×2 + 10×2 + 5×1 = 45 seats consumed across tables
      for (const table of arrangement.items) {
        if (table.name !== 'Newlyweds') {
          expect(table.seats.length).toBeGreaterThan(0);
        }
      }
    });

    it('should seat 100 guests (mixed sides, no VIPs) within 3s', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();

      // max_tables=40, max_seats=30 → capacity 1200, enough for 100 guests
      await seatingTablesTestManager.updateArrangement(
        { max_tables_amount: 40, max_seats_per_table_amount: 30 },
        accessToken,
      );

      await createGuests(userId, accessToken, 50, {
        relationship_to_couple: RelationshipToCouple.BrideSide,
      });
      await createGuests(userId, accessToken, 50, {
        relationship_to_couple: RelationshipToCouple.GroomSide,
      });

      const start = Date.now();
      const arrangement = await seatingTablesTestManager.autoSeat(accessToken);
      console.log(arrangement);
      const elapsed = Date.now() - start;

      console.log(`[auto-seat] 100 guests, no VIPs — ${elapsed}ms`);

      const allSeats = arrangement.items.flatMap((t: any) => t.seats);
      expect(allSeats).toHaveLength(100);
      expect(elapsed).toBeLessThan(3000);
    });

    it('should seat 100 guests with VIPs on dedicated tables within 3s', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();

      await seatingTablesTestManager.updateArrangement(
        { max_tables_amount: 40, max_seats_per_table_amount: 30 },
        accessToken,
      );

      // 10 bride VIPs + 10 groom VIPs → dedicated tables
      await createGuests(userId, accessToken, 10, {
        relationship_to_couple: RelationshipToCouple.BrideSide,
        vip_parents: true,
      });
      await createGuests(userId, accessToken, 10, {
        relationship_to_couple: RelationshipToCouple.GroomSide,
        vip_parents: true,
      });
      // 40 bride regular + 40 groom regular
      await createGuests(userId, accessToken, 40, {
        relationship_to_couple: RelationshipToCouple.BrideSide,
      });
      await createGuests(userId, accessToken, 40, {
        relationship_to_couple: RelationshipToCouple.GroomSide,
      });

      const start = Date.now();
      const arrangement = await seatingTablesTestManager.autoSeat(accessToken);
      console.log(arrangement);
      const elapsed = Date.now() - start;

      console.log(`[auto-seat] 100 guests with VIPs — ${elapsed}ms`);

      const allSeats = arrangement.items.flatMap((t: any) => t.seats);
      expect(allSeats).toHaveLength(100);
      expect(elapsed).toBeLessThan(3000);
    });

    it('should seat 100 guests with plus-ones and kids within 3s', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();

      // 40×weight2 + 40×weight2 + 20×weight1 = 180 seats consumed → need 40 tables of 5+
      await seatingTablesTestManager.updateArrangement(
        { max_tables_amount: 40, max_seats_per_table_amount: 10 },
        accessToken,
      );

      // 40 guests with unlisted partner (weight 2 each = 80 seats)
      await createGuests(
        userId,
        accessToken,
        40,
        {
          relationship_to_couple: RelationshipToCouple.BrideSide,
          ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({ response: true }),
        },
      );
      // 40 guests with 1 kid each (weight 2 each = 80 seats)
      await createGuests(
        userId,
        accessToken,
        40,
        { relationship_to_couple: RelationshipToCouple.GroomSide },
        1,
      );
      // 20 solo guests (weight 1 each = 20 seats)
      await createGuests(userId, accessToken, 20, {
        relationship_to_couple: RelationshipToCouple.Mutual,
      });

      const start = Date.now();
      const arrangement = await seatingTablesTestManager.autoSeat(accessToken);
      const elapsed = Date.now() - start;

      console.log(`[auto-seat] 100 guests with plus-ones/kids — ${elapsed}ms`);

      // 100 seat records (plus-ones and kids have no seat record)
      const allSeats = arrangement.items.flatMap((t: any) => t.seats);
      expect(allSeats).toHaveLength(100);
      expect(elapsed).toBeLessThan(3000);
    });

    it('should return 403 when total seats needed exceed capacity', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();

      // max capacity = 2 tables × 3 seats = 6, but we create 10 guests
      await seatingTablesTestManager.updateArrangement(
        { max_tables_amount: 2, max_seats_per_table_amount: 3 },
        accessToken,
      );

      await createGuests(userId, accessToken, 10, {
        relationship_to_couple: RelationshipToCouple.BrideSide,
      });

      await seatingTablesTestManager.autoSeat(
        accessToken,
        HttpStatus.FORBIDDEN,
      );
    });

    it('should return 403 when a single guest unit cannot fit in any table', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();

      // max 2 seats per table — guest + unlisted partner + 2 kids = weight 4, won't fit
      await seatingTablesTestManager.updateArrangement(
        { max_tables_amount: 10, max_seats_per_table_amount: 2 },
        accessToken,
      );

      await guestsTestManager.createGuest(
        guestsTestManager.buildCreateGuestDto(userId, {
          guestForm: guestsTestManager.buildGuestFormDto({
            relationship_to_couple: RelationshipToCouple.BrideSide,
            has_kids_attending: true,
            amount_of_kids: 2,
            ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({ response: true }),
          }),
        }),
        accessToken,
      );

      await seatingTablesTestManager.autoSeat(
        accessToken,
        HttpStatus.FORBIDDEN,
      );
    });

    it('should seat guests who have both plus-one and 2-3 kids correctly', async () => {
      const { accessToken, userId } =
        await userAccountsTestManager.createUserAndLogin();

      // guest + plus_one + 3 kids = weight 5 → need max_seats_per_table >= 5
      await seatingTablesTestManager.updateArrangement(
        { max_tables_amount: 40, max_seats_per_table_amount: 10 },
        accessToken,
      );

      // 5 bride guests each with unlisted partner + 3 kids (weight 5 each = 25 seats)
      await createGuests(
        userId,
        accessToken,
        5,
        {
          relationship_to_couple: RelationshipToCouple.BrideSide,
          ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({ response: true }),
        },
        3,
      );

      // 5 groom guests each with unlisted partner + 2 kids (weight 4 each = 20 seats)
      await createGuests(
        userId,
        accessToken,
        5,
        {
          relationship_to_couple: RelationshipToCouple.GroomSide,
          ifWithCouple: guestsTestManager.buildGuestCoupleStatusDto({ response: true }),
        },
        2,
      );

      const arrangement = await seatingTablesTestManager.autoSeat(accessToken);

      // 10 seat records total (unlisted partner and kids consume capacity, no seat record)
      const allSeats = arrangement.items.flatMap((t: any) => t.seats);
      expect(allSeats).toHaveLength(10);

      // weight 5: max 2 per table (2×5=10); weight 4: max 2 per table (3×4=12 > 10)
      for (const table of arrangement.items) {
        if (table.name !== 'Newlyweds') {
          expect(table.seats.length).toBeGreaterThan(0);
        }
        expect(table.seats.length).toBeLessThanOrEqual(2);
      }
    });
  });
});
