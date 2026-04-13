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
import { CreateSectionInputDto } from './input-dto/create-section.input-dto';
import { UpdateSectionInputDto } from './input-dto/update-section.input-dto';
import { MoveBudgetSectionInputDto } from './input-dto/move-budget-section.input-dto';
import { CreateSectionCommand } from '../app/usecases/create-section.usecase';
import { UpdateSectionCommand } from '../app/usecases/update-section.usecase';
import { DeleteSectionCommand } from '../app/usecases/delete-section.usecase';
import { MoveSectionCommand } from '../app/usecases/move-section.usecase';

@ApiTags('Budget sections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserOwnershipGuard)
@ApiQuery({ name: 'userId', required: false, type: Number })
@Controller('budget/sections')
export class BudgetSectionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly budgetQueryRepository: BudgetQueryRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSection(
    @Body() dto: CreateSectionInputDto,
    @EffectiveUserId() userId: number,
  ): Promise<BudgetViewDto> {
    await this.commandBus.execute(new CreateSectionCommand(dto, userId));
    return this.budgetQueryRepository.findFullBudgetByUserId(userId);
  }

  @Patch('move')
  async moveSection(
    @Body() dto: MoveBudgetSectionInputDto,
    @EffectiveUserId() userId: number,
  ): Promise<BudgetSectionViewDto[]> {
    const affectedSectionIds = await this.commandBus.execute<MoveSectionCommand, number[]>(
      new MoveSectionCommand(dto, userId),
    );
    return this.budgetQueryRepository.findSectionViewsByIdsForUser(userId, affectedSectionIds);
  }

  @Patch(':id')
  async updateSection(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSectionInputDto,
    @EffectiveUserId() userId: number,
  ): Promise<BudgetViewDto> {
    await this.commandBus.execute(new UpdateSectionCommand(id, dto, userId));
    return this.budgetQueryRepository.findFullBudgetByUserId(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSection(
    @Param('id', ParseIntPipe) id: number,
    @EffectiveUserId() userId: number,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteSectionCommand(id, userId));
  }
}