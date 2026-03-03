import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { BudgetQueryRepository } from '../infra/query/budget.query-repository';
import { BudgetViewDto } from './view-dto/budget.view-dto';
import { UpdateBudgetInputDto } from './input-dto/update-budget.input-dto';
import { UpdateBudgetCommand } from '../app/usecases/update-budget.usecase';

@ApiTags('Budget')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budget')
export class BudgetController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly budgetQueryRepository: BudgetQueryRepository,
  ) {}

  @Get()
  async getBudget(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<BudgetViewDto> {
    return this.budgetQueryRepository.findFullBudgetByUserId(user.id);
  }

  @Patch()
  async updateBudget(
    @Body() dto: UpdateBudgetInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<BudgetViewDto> {
    await this.commandBus.execute(new UpdateBudgetCommand(dto, user.id));
    return this.budgetQueryRepository.findFullBudgetByUserId(user.id);
  }
}