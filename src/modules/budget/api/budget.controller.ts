import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { UserOwnershipGuard } from '../../user-accounts/guards/ownership/user-ownership.guard';
import { EffectiveUserId } from '../../user-accounts/guards/ownership/effective-user-id.decorator';
import { BudgetQueryRepository } from '../infra/query/budget.query-repository';
import { BudgetViewDto } from './view-dto/budget.view-dto';
import { UpdateBudgetInputDto } from './input-dto/update-budget.input-dto';
import { UpdateBudgetCommand } from '../app/usecases/update-budget.usecase';

@ApiTags('Budget')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserOwnershipGuard)
@ApiQuery({ name: 'userId', required: false, type: Number })
@Controller('budget')
export class BudgetController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly budgetQueryRepository: BudgetQueryRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get budget. SuperUsers may pass ?userId to access a plain user\'s budget.' })
  async getBudget(@EffectiveUserId() userId: number): Promise<BudgetViewDto> {
    return this.budgetQueryRepository.findFullBudgetByUserId(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update budget. SuperUsers may pass ?userId to update a plain user\'s budget.' })
  async updateBudget(
    @Body() dto: UpdateBudgetInputDto,
    @EffectiveUserId() userId: number,
  ): Promise<BudgetViewDto> {
    await this.commandBus.execute(new UpdateBudgetCommand(dto, userId));
    return this.budgetQueryRepository.findFullBudgetByUserId(userId);
  }
}