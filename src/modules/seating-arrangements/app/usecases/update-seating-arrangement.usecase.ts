import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { SeatingArrangementsRepository } from '../../infra/seating-arrangements.repository';
import { UpdateSeatingArrangementInputDto } from '../../api/input-dto/update-seating-arrangement.input-dto';

export class UpdateSeatingArrangementCommand {
  constructor(
    public readonly dto: UpdateSeatingArrangementInputDto,
    public readonly userId: number,
  ) {}
}

@CommandHandler(UpdateSeatingArrangementCommand)
export class UpdateSeatingArrangementUseCase
  implements ICommandHandler<UpdateSeatingArrangementCommand, void>
{
  constructor(
    private readonly dataSource: DataSource,
    private readonly arrangementRepository: SeatingArrangementsRepository,
  ) {}

  async execute({ dto, userId }: UpdateSeatingArrangementCommand): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const arrangement = await this.arrangementRepository.findByUserIdForUpdateOrFail(
        manager,
        userId,
      );

      if (dto.shape !== undefined) arrangement.shape = dto.shape;
      if (dto.width !== undefined) arrangement.width = dto.width;
      if (dto.height !== undefined) arrangement.height = dto.height;
      if (dto.max_tables_amount !== undefined) arrangement.max_tables_amount = dto.max_tables_amount;
      if (dto.max_seats_per_table_amount !== undefined) arrangement.max_seats_per_table_amount = dto.max_seats_per_table_amount;

      await this.arrangementRepository.saveEntityWithManager(manager, arrangement);
    });
  }
}