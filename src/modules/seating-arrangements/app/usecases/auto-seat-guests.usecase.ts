import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { SeatingArrangementsRepository } from '../../infra/seating-arrangements.repository';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';
import { SeatingSeatsRepository } from '../../infra/seating-seats.repository';
import { GuestsRepository } from '../../../guests/infra/guests.repository';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Guest } from '../../../guests/domain/enteties/guest.entity';
import { RelationshipToCouple } from '../../../guests/domain/enteties/guest-form.entity';

interface SeatableUnit {
  guestId: string;
  weight: number;
  relationshipToCouple: RelationshipToCouple;
  tableGroup: string;
  isVip: boolean;
  hasKids: boolean;
  personalityType: string;
}

interface TableBucket {
  name: string;
  position: { x: number; y: number };
  guestIds: string[];
  usedSeats: number;
  tableGroup: string;
}

export class AutoSeatGuestsCommand {
  constructor(public readonly userId: number) {}
}

@CommandHandler(AutoSeatGuestsCommand)
export class AutoSeatGuestsUseCase implements ICommandHandler<
  AutoSeatGuestsCommand,
  void
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly arrangementRepository: SeatingArrangementsRepository,
    private readonly tablesRepository: SeatingTablesRepository,
    private readonly seatsRepository: SeatingSeatsRepository,
    private readonly guestsRepository: GuestsRepository,
  ) {}

  async execute({ userId }: AutoSeatGuestsCommand): Promise<void> {
    const arrangement =
      await this.arrangementRepository.findByUserIdOrFail(userId);
    const guests =
      await this.guestsRepository.findAllWithRelationsByUserId(userId);

    if (!guests.length) return;

    const units = guests.map((g) => this.buildSeatableUnit(g));

    this.validateUnitsFitInTable(units, arrangement.max_seats_per_table_amount);
    this.validateTotalCapacity(
      units,
      arrangement.max_tables_amount,
      arrangement.max_seats_per_table_amount,
    );

    const sortedUnits = this.sortUnits(units);
    const unitsByGuestId = new Map(units.map((u) => [u.guestId, u]));

    const packedTables = this.packIntoTables(
      sortedUnits,
      arrangement.max_seats_per_table_amount,
    );
    const tables = this.balanceTables(
      packedTables,
      unitsByGuestId,
      arrangement.max_seats_per_table_amount,
    );

    const allTables = this.buildFinalTablesArray(arrangement.width, tables);

    this.validateTablesCount(allTables.length, arrangement.max_tables_amount);

    this.assignPositions(tables, arrangement.width, arrangement.height);

    await this.saveArrangement(arrangement.id, allTables);
  }

  private async saveArrangement(
    arrangementId: string,
    tables: TableBucket[],
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.tablesRepository.deleteAllByArrangementIdWithManager(
        manager,
        arrangementId,
      );

      for (const tableData of tables) {
        const tableId = await this.tablesRepository.saveEntityWithManager(
          manager,
          {
            arrangement_id: arrangementId,
            name: tableData.name,
            position: tableData.position,
            shape: 'circle',
            rotation: 0,
            radius: 70,
          },
        );

        for (const guestId of tableData.guestIds) {
          await this.seatsRepository.saveWithManager(manager, {
            table_id: tableId,
            guest_id: guestId,
          });
        }
      }
    });
  }

  private validateTablesCount(tablesCount: number, maxTables: number): void {
    if (tablesCount > maxTables) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `Need ${tablesCount} tables but maximum is ${maxTables}`,
      });
    }
  }

  private validateUnitsFitInTable(
    units: SeatableUnit[],
    maxSeatsPerTable: number,
  ): void {
    for (const unit of units) {
      if (unit.weight > maxSeatsPerTable) {
        throw new DomainException({
          code: DomainExceptionCode.Forbidden,
          message: `A guest requires ${unit.weight} seats but table maximum is ${maxSeatsPerTable}`,
        });
      }
    }
  }

  private validateTotalCapacity(
    units: SeatableUnit[],
    maxTables: number,
    maxSeatsPerTable: number,
  ): void {
    const totalSeatsNeeded = units.reduce((sum, u) => sum + u.weight, 0);
    const totalCapacity = maxTables * maxSeatsPerTable;
    if (totalSeatsNeeded > totalCapacity) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: `Need ${totalSeatsNeeded} seats but total capacity is ${totalCapacity}`,
      });
    }
  }

  private buildSeatableUnit(guest: Guest): SeatableUnit {
    const form = guest.guestForm!;
    const plusOne = guest.response?.plus_one ? 1 : 0;
    const kidsCount = form.has_kids_attending ? (form.amount_of_kids ?? 0) : 0;

    const isVip =
      form.vip_parents || form.vip_grandparents || form.vip_relatives;
    return {
      guestId: guest.id,
      weight: 1 + plusOne + kidsCount,
      relationshipToCouple: form.relationship_to_couple,
      tableGroup: isVip ? `vip:${form.relationship_to_couple}` : 'regular',
      isVip,
      hasKids: form.has_kids_attending && kidsCount > 0,
      personalityType: form.personality_type,
    };
  }

  private sortUnits(units: SeatableUnit[]): SeatableUnit[] {
    const sortSubGroup = (arr: SeatableUnit[]) =>
      [...arr].sort((a, b) => {
        if (a.hasKids !== b.hasKids) return a.hasKids ? -1 : 1;
        return a.personalityType.localeCompare(b.personalityType);
      });

    const vipBride = sortSubGroup(
      units.filter(
        (u) =>
          u.isVip && u.relationshipToCouple === RelationshipToCouple.BrideSide,
      ),
    );
    const vipGroom = sortSubGroup(
      units.filter(
        (u) =>
          u.isVip && u.relationshipToCouple === RelationshipToCouple.GroomSide,
      ),
    );
    const vipMutual = sortSubGroup(
      units.filter(
        (u) =>
          u.isVip && u.relationshipToCouple === RelationshipToCouple.Mutual,
      ),
    );

    const regularBride = this.shuffleSlightly(
      sortSubGroup(
        units.filter(
          (u) =>
            !u.isVip &&
            u.relationshipToCouple === RelationshipToCouple.BrideSide,
        ),
      ),
    );
    const regularGroom = this.shuffleSlightly(
      sortSubGroup(
        units.filter(
          (u) =>
            !u.isVip &&
            u.relationshipToCouple === RelationshipToCouple.GroomSide,
        ),
      ),
    );
    const regularMutual = this.shuffleSlightly(
      sortSubGroup(
        units.filter(
          (u) =>
            !u.isVip && u.relationshipToCouple === RelationshipToCouple.Mutual,
        ),
      ),
    );

    const interleaved = this.interleaveGroups([
      regularBride,
      regularGroom,
      regularMutual,
    ]);

    const mergedVipBride = [...vipBride];
    const mergedVipGroom = [...vipGroom];

    if (vipMutual.length < 4) {
      vipMutual.forEach((u, i) => {
        const target = i % 2 === 0 ? mergedVipBride : mergedVipGroom;
        target.push({
          ...u,
          tableGroup: `vip:${i % 2 === 0 ? RelationshipToCouple.BrideSide : RelationshipToCouple.GroomSide}`,
        });
      });
      return [...mergedVipBride, ...mergedVipGroom, ...interleaved];
    }

    return [...vipBride, ...vipGroom, ...vipMutual, ...interleaved];
  }

  private shuffleSlightly(arr: SeatableUnit[]): SeatableUnit[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private interleaveGroups(groups: SeatableUnit[][]): SeatableUnit[] {
    const result: SeatableUnit[] = [];
    const maxLen = Math.max(...groups.map((g) => g.length));
    for (let i = 0; i < maxLen; i++) {
      for (const group of groups) {
        if (i < group.length) result.push(group[i]);
      }
    }
    return result;
  }

  private packIntoTables(
    units: SeatableUnit[],
    maxSeatsPerTable: number,
  ): TableBucket[] {
    const tables: TableBucket[] = [];
    let current: TableBucket = {
      name: '',
      position: { x: 0, y: 0 },
      guestIds: [],
      usedSeats: 0,
      tableGroup: '',
    };
    let currentGroupKey = '';

    const groupKey = (unit: SeatableUnit) => unit.tableGroup;

    const closeCurrentTable = () => {
      if (current.guestIds.length > 0) {
        tables.push(current);
        current = {
          name: '',
          position: { x: 0, y: 0 },
          guestIds: [],
          usedSeats: 0,
          tableGroup: '',
        };
      }
    };

    for (const unit of units) {
      const unitGroupKey = groupKey(unit);
      const groupChanged = currentGroupKey && unitGroupKey !== currentGroupKey;

      if (groupChanged || current.usedSeats + unit.weight > maxSeatsPerTable) {
        closeCurrentTable();
      }

      currentGroupKey = unitGroupKey;
      current.tableGroup = unitGroupKey;
      current.guestIds.push(unit.guestId);
      current.usedSeats += unit.weight;
    }

    closeCurrentTable();

    return tables;
  }

  private buildFinalTablesArray(
    workspaceWidth: number,
    tables: TableBucket[],
  ): TableBucket[] {
    const namedTables = tables.map((t, i) => ({ ...t, name: `${i + 1}` }));

    return [
      {
        name: 'Newlyweds',
        position: { x: Math.round(workspaceWidth / 2), y: 20 },
        guestIds: [],
        usedSeats: 0,
        tableGroup: 'newlyweds',
      },
      ...namedTables,
    ];
  }

  private balanceTables(
    tables: TableBucket[],
    unitsByGuestId: Map<string, SeatableUnit>,
    maxSeatsPerTable: number,
  ): TableBucket[] {
    const groupMap = new Map<string, TableBucket[]>();
    for (const table of tables) {
      if (!groupMap.has(table.tableGroup)) groupMap.set(table.tableGroup, []);
      groupMap.get(table.tableGroup)!.push(table);
    }

    const result: TableBucket[] = [];

    for (const [group, groupTables] of groupMap) {
      if (groupTables.length <= 1 || group.startsWith('vip:')) {
        result.push(...groupTables);
        continue;
      }

      const allUnits = groupTables
        .flatMap((t) => t.guestIds.map((id) => unitsByGuestId.get(id)!))
        .sort((a, b) => b.weight - a.weight);

      const totalWeight = allUnits.reduce((sum, u) => sum + u.weight, 0);
      const tableCount = Math.ceil(totalWeight / maxSeatsPerTable);

      const balanced: TableBucket[] = Array.from(
        { length: tableCount },
        () => ({
          name: '',
          position: { x: 0, y: 0 },
          guestIds: [],
          usedSeats: 0,
          tableGroup: group,
        }),
      );

      for (const unit of allUnits) {
        const target = balanced
          .filter((t) => t.usedSeats + unit.weight <= maxSeatsPerTable)
          .sort((a, b) => a.usedSeats - b.usedSeats)[0];

        if (target) {
          target.guestIds.push(unit.guestId);
          target.usedSeats += unit.weight;
        }
      }

      result.push(...balanced.filter((t) => t.guestIds.length > 0));
    }

    return result;
  }

  private assignPositions(
    tables: TableBucket[],
    width: number,
    height: number,
  ): void {
    const count = tables.length;
    const cols = Math.ceil(Math.sqrt(count));
    const spacingX = width / (cols + 1);
    const spacingY = height / (Math.ceil(count / cols) + 1);

    tables.forEach((table, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      table.position = {
        x: Math.round((col + 1) * spacingX),
        y: Math.round((row + 1) * spacingY),
      };
    });
  }
}
