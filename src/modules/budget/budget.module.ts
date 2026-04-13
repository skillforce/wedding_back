import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { Budget } from './domain/entities/budget.entity';
import { BudgetSection } from './domain/entities/budget-section.entity';
import { BudgetItem } from './domain/entities/budget-item.entity';
import { BudgetController } from './api/budget.controller';
import { BudgetSectionsController } from './api/budget-sections.controller';
import { BudgetItemsController } from './api/budget-items.controller';
import { BudgetRepository } from './infra/budget.repository';
import { BudgetSectionsRepository } from './infra/budget-sections.repository';
import { BudgetItemsRepository } from './infra/budget-items.repository';
import { BudgetQueryRepository } from './infra/query/budget.query-repository';
import { CreateDefaultBudgetUseCase } from './app/usecases/create-default-budget.usecase';
import { UpdateBudgetUseCase } from './app/usecases/update-budget.usecase';
import { CreateSectionUseCase } from './app/usecases/create-section.usecase';
import { MoveSectionUseCase } from './app/usecases/move-section.usecase';
import { UpdateSectionUseCase } from './app/usecases/update-section.usecase';
import { DeleteSectionUseCase } from './app/usecases/delete-section.usecase';
import { CreateItemUseCase } from './app/usecases/create-item.usecase';
import { MoveItemUseCase } from './app/usecases/move-item.usecase';
import { UpdateItemUseCase } from './app/usecases/update-item.usecase';
import { DeleteItemUseCase } from './app/usecases/delete-item.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget, BudgetSection, BudgetItem]),
    UserAccountsModule,
  ],
  controllers: [
    BudgetController,
    BudgetSectionsController,
    BudgetItemsController,
  ],
  providers: [
    BudgetRepository,
    BudgetSectionsRepository,
    BudgetItemsRepository,
    BudgetQueryRepository,
    CreateDefaultBudgetUseCase,
    UpdateBudgetUseCase,
    CreateSectionUseCase,
    MoveSectionUseCase,
    UpdateSectionUseCase,
    DeleteSectionUseCase,
    CreateItemUseCase,
    MoveItemUseCase,
    UpdateItemUseCase,
    DeleteItemUseCase,
  ],
})
export class BudgetModule {}
