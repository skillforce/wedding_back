import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';
import { SeatingSeatsRepository } from '../../infra/seating-seats.repository';
import { CreateSeatingSeatInputDto } from '../../api/input-dto/create-seating-seat.input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

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
    private readonly tablesRepository: SeatingTablesRepository,
    private readonly seatsRepository: SeatingSeatsRepository,
  ) {}

  async execute({
    tableId,
    dto,
    userId,
  }: CreateSeatingSeatCommand): Promise<string> {
    await this.findTableAndCheckOwnership(tableId, userId);

    const newSeat = {
      table_id: tableId,
      name: dto.name,
    };
    return this.seatsRepository.save(newSeat);
  }

  private async findTableAndCheckOwnership(tableId: string, userId: number): Promise<void> {
    const table = await this.tablesRepository.findByIdOrFail(tableId);
    if (table.user_id !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Seating table does not belong to user',
      });
    }
  }
}
