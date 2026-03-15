import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SeatingTablesRepository } from '../../infra/seating-tables.repository';
import { SeatingArrangementsRepository } from '../../infra/seating-arrangements.repository';
import { CreateSeatingTableInputDto } from '../../api/input-dto/create-seating-table.input-dto';
import { TableShape } from '../../domain/entities/seating-table.entity';

export class CreateSeatingTableCommand {
  constructor(
    public readonly dto: CreateSeatingTableInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(CreateSeatingTableCommand)
export class CreateSeatingTableUseCase implements ICommandHandler<
  CreateSeatingTableCommand,
  string
> {
  constructor(
    private readonly tablesRepository: SeatingTablesRepository,
    private readonly arrangementRepository: SeatingArrangementsRepository,
  ) {}

  async execute({ dto, userId }: CreateSeatingTableCommand): Promise<string> {
    const arrangement =
      await this.arrangementRepository.findByUserIdOrFail(userId);
    return this.tablesRepository.save({
      arrangement_id: arrangement.id,
      name: dto.name,
      position: dto.position,
      shape: dto.shape ?? TableShape.Circle,
      rotation: dto.rotation ?? 0,
      radius: dto.radius ?? 70,
    });
  }
}
