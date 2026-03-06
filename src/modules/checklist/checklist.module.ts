import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checklist } from './domain/entities/checklist.entity';
import { ChecklistPhase } from './domain/entities/checklist-phase.entity';
import { ChecklistItem } from './domain/entities/checklist-item.entity';
import { ChecklistController } from './api/checklist.controller';
import { ChecklistPhasesController } from './api/checklist-phases.controller';
import { ChecklistItemsController } from './api/checklist-items.controller';
import { ChecklistRepository } from './infra/checklist.repository';
import { ChecklistPhasesRepository } from './infra/checklist-phases.repository';
import { ChecklistItemsRepository } from './infra/checklist-items.repository';
import { ChecklistQueryRepository } from './infra/query/checklist.query-repository';
import { CreateDefaultChecklistUseCase } from './app/usecases/create-default-checklist.usecase';
import { ResetChecklistUseCase } from './app/usecases/reset-checklist.usecase';
import { CreatePhaseUseCase } from './app/usecases/create-phase.usecase';
import { UpdatePhaseUseCase } from './app/usecases/update-phase.usecase';
import { DeletePhaseUseCase } from './app/usecases/delete-phase.usecase';
import { CreateItemUseCase } from './app/usecases/create-item.usecase';
import { UpdateItemUseCase } from './app/usecases/update-item.usecase';
import { ToggleItemCompletionUseCase } from './app/usecases/toggle-item-completion.usecase';
import { DeleteItemUseCase } from './app/usecases/delete-item.usecase';
import { MoveItemUseCase } from './app/usecases/move-item.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([Checklist, ChecklistPhase, ChecklistItem])],
  controllers: [
    ChecklistController,
    ChecklistPhasesController,
    ChecklistItemsController,
  ],
  providers: [
    ChecklistRepository,
    ChecklistPhasesRepository,
    ChecklistItemsRepository,
    ChecklistQueryRepository,
    CreateDefaultChecklistUseCase,
    ResetChecklistUseCase,
    CreatePhaseUseCase,
    UpdatePhaseUseCase,
    DeletePhaseUseCase,
    CreateItemUseCase,
    UpdateItemUseCase,
    ToggleItemCompletionUseCase,
    DeleteItemUseCase,
    MoveItemUseCase,
  ],
})
export class ChecklistModule {}
