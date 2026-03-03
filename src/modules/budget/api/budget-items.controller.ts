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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { BudgetQueryRepository } from '../infra/query/budget.query-repository';
import { BudgetViewDto } from './view-dto/budget.view-dto';
import { CreateItemInputDto } from './input-dto/create-item.input-dto';
import { UpdateItemInputDto } from './input-dto/update-item.input-dto';
import { CreateItemCommand } from '../app/usecases/create-item.usecase';
import { UpdateItemCommand } from '../app/usecases/update-item.usecase';
import { DeleteItemCommand } from '../app/usecases/delete-item.usecase';

@ApiTags('Budget items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budget/items')
export class BudgetItemsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly budgetQueryRepository: BudgetQueryRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createItem(
    @Body() dto: CreateItemInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<BudgetViewDto> {
    await this.commandBus.execute(new CreateItemCommand(dto, user.id));
    return this.budgetQueryRepository.findFullBudgetByUserId(user.id);
  }

  @Patch(':id')
  async updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<BudgetViewDto> {
    await this.commandBus.execute(new UpdateItemCommand(id, dto, user.id));
    return this.budgetQueryRepository.findFullBudgetByUserId(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteItem(
    @Param('id', ParseIntPipe) id: number,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteItemCommand(id, user.id));
  }
}