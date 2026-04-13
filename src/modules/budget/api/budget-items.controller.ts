import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { UserOwnershipGuard } from '../../user-accounts/guards/ownership/user-ownership.guard';
import { EffectiveUserId } from '../../user-accounts/guards/ownership/effective-user-id.decorator';
import { BudgetQueryRepository } from '../infra/query/budget.query-repository';
import { BudgetViewDto } from './view-dto/budget.view-dto';
import { BudgetSectionViewDto } from './view-dto/budget-section.view-dto';
import { CreateBudgetSectionItemInputDto } from './input-dto/create-budget-section-item-input.dto';
import { UpdateBudgetSectionItemInputDto } from './input-dto/update-budget-section-item-input.dto';
import { MoveBudgetItemInputDto } from './input-dto/move-budget-item.input-dto';
import { CreateItemCommand } from '../app/usecases/create-item.usecase';
import { UpdateItemCommand } from '../app/usecases/update-item.usecase';
import { DeleteItemCommand } from '../app/usecases/delete-item.usecase';
import { MoveItemCommand } from '../app/usecases/move-item.usecase';

@ApiTags('Budget items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserOwnershipGuard)
@ApiQuery({ name: 'userId', required: false, type: Number })
@Controller('budget/items')
export class BudgetItemsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly budgetQueryRepository: BudgetQueryRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createItem(
    @Body() dto: CreateBudgetSectionItemInputDto,
    @EffectiveUserId() userId: number,
  ): Promise<BudgetViewDto> {
    await this.commandBus.execute(new CreateItemCommand(dto, userId));
    return this.budgetQueryRepository.findFullBudgetByUserId(userId);
  }

  @Patch('move')
  async moveItem(
    @Body() dto: MoveBudgetItemInputDto,
    @EffectiveUserId() userId: number,
  ): Promise<BudgetSectionViewDto[]> {
    const affectedSectionIds = await this.commandBus.execute<MoveItemCommand, number[]>(
      new MoveItemCommand(dto, userId),
    );
    return this.budgetQueryRepository.findSectionViewsByIdsForUser(userId, affectedSectionIds);
  }

  @Patch(':id')
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetSectionItemInputDto,
    @EffectiveUserId() userId: number,
  ): Promise<BudgetViewDto> {
    await this.commandBus.execute(new UpdateItemCommand(id, dto, userId));
    return this.budgetQueryRepository.findFullBudgetByUserId(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteItem(
    @Param('id', ParseIntPipe) id: number,
    @EffectiveUserId() userId: number,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteItemCommand(id, userId));
  }
}