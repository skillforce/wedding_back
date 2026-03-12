import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SeatingArrangementsRepository } from '../../infra/seating-arrangements.repository';
import {
  workspaceConstraints,
  workspaceShapeValues,
} from '../../domain/entities/seating-arrangement.entity';

export class CreateDefaultSeatingArrangementCommand {
  constructor(public readonly userId: number) {}
}

@CommandHandler(CreateDefaultSeatingArrangementCommand)
export class CreateDefaultSeatingArrangementUseCase implements ICommandHandler<
  CreateDefaultSeatingArrangementCommand,
  void
> {
  constructor(
    private readonly arrangementRepository: SeatingArrangementsRepository,
  ) {}

  async execute({
    userId,
  }: CreateDefaultSeatingArrangementCommand): Promise<void> {
    const defaultArrangement = {
      user_id: userId,
      shape: workspaceShapeValues[0],
      width: workspaceConstraints.minWidth,
      height: workspaceConstraints.minHeight,
      max_tables_amount: 20,
      max_seats_per_table_amount: 8,
    };
    await this.arrangementRepository.save(defaultArrangement);
  }
}
