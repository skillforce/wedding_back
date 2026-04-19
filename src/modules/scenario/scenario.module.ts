import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scenario } from './domain/entities/scenario.entity';
import { ScenarioPoint } from './domain/entities/scenario-point.entity';
import { ScenarioController } from './api/scenario.controller';
import { ScenarioPointsController } from './api/scenario-points.controller';
import { ScenarioRepository } from './infra/scenario.repository';
import { ScenarioPointRepository } from './infra/scenario-point.repository';
import { ScenarioQueryRepository } from './infra/query/scenario.query-repository';
import { CreateDefaultScenarioUseCase } from './app/usecases/create-default-scenario.usecase';
import { CreateScenarioPointUseCase } from './app/usecases/create-scenario-point.usecase';
import { UpdateScenarioPointUseCase } from './app/usecases/update-scenario-point.usecase';
import { DeleteScenarioPointUseCase } from './app/usecases/delete-scenario-point.usecase';
import { SeedScenarioUseCase } from './app/usecases/seed-scenario.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([Scenario, ScenarioPoint])],
  controllers: [ScenarioController, ScenarioPointsController],
  providers: [
    ScenarioRepository,
    ScenarioPointRepository,
    ScenarioQueryRepository,
    CreateDefaultScenarioUseCase,
    CreateScenarioPointUseCase,
    UpdateScenarioPointUseCase,
    DeleteScenarioPointUseCase,
    SeedScenarioUseCase,
  ],
  exports: [CreateDefaultScenarioUseCase],
})
export class ScenarioModule {}