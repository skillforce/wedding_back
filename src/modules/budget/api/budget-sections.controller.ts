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
import { CreateSectionInputDto } from './input-dto/create-section.input-dto';
import { UpdateSectionInputDto } from './input-dto/update-section.input-dto';
import { CreateSectionCommand } from '../app/usecases/create-section.usecase';
import { UpdateSectionCommand } from '../app/usecases/update-section.usecase';
import { DeleteSectionCommand } from '../app/usecases/delete-section.usecase';

@ApiTags('Budget sections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<BudgetViewDto> {
    await this.commandBus.execute(new CreateSectionCommand(dto, user.id));
    return this.budgetQueryRepository.findFullBudgetByUserId(user.id);
  }

  @Patch(':id')
  async updateSection(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSectionInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<BudgetViewDto> {
    await this.commandBus.execute(new UpdateSectionCommand(id, dto, user.id));
    return this.budgetQueryRepository.findFullBudgetByUserId(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSection(
    @Param('id', ParseIntPipe) id: number,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteSectionCommand(id, user.id));
  }
}