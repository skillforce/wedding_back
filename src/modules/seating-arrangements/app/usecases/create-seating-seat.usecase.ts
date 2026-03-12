import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateSeatingSeatInputDto } from '../../api/input-dto/create-seating-seat.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DataSource } from 'typeorm';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';
import { SeatingSeatsRepository } from '../../infra/seating-seats.repository';

export class CreateSeatingSeatCommand {
  constructor(
    public readonly tableId: string,
    public readonly dto: CreateSeatingSeatInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(CreateSeatingSeatCommand)
export class CreateSeatingSeatUseCase implements ICommandHandler<
  CreateSeatingSeatCommand,
  string
> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tablesRepository: SeatingTablesRepository,
    private readonly seatsRepository: SeatingSeatsRepository,
  ) {}

  async execute({
    tableId,
    dto,
    userId,
  }: CreateSeatingSeatCommand): Promise<string> {
    return this.dataSource.transaction(async (manager) => {
      const table = await this.tablesRepository.findByIdForUpdateOrFail(manager, tableId);
      this.checkTableOwnership(table.arrangement!.user_id, userId);

      await this.seatsRepository.deleteByGuestIdWithManager(manager, dto.guest_id);

      return this.seatsRepository.saveWithManager(manager, {
        table_id: tableId,
        guest_id: dto.guest_id,
      });
    });
  }

  private checkTableOwnership(ownerUserId: number, userId: number): void {
    if (ownerUserId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Seating table does not belong to user',
      });
    }
  }
}
