import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { ChecklistQueryRepository } from '../infra/query/checklist.query-repository';
import { CreateChecklistPhaseItemInputDto } from './input-dto/create-checklist-phase-item-input.dto';
import { UpdateChecklistPhaseItemInputDto } from './input-dto/update-checklist-phase-item-input.dto';
import { MoveItemInputDto } from './input-dto/move-item.input-dto';
import { ChecklistItemViewDto } from './view-dto/checklist-item.view-dto';
import { ChecklistItemCompletionViewDto } from './view-dto/checklist-item-completion.view-dto';
import { CreateItemCommand } from '../app/usecases/create-item.usecase';
import { UpdateItemCommand } from '../app/usecases/update-item.usecase';
import { ToggleItemCompletionCommand } from '../app/usecases/toggle-item-completion.usecase';
import { DeleteItemCommand } from '../app/usecases/delete-item.usecase';
import { MoveItemCommand } from '../app/usecases/move-item.usecase';

@ApiTags('Checklist items')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checklist')
export class ChecklistItemsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly checklistQueryRepository: ChecklistQueryRepository,
  ) {}

  @Post('phases/:phaseId/items')
  @HttpCode(HttpStatus.CREATED)
  async createItem(
    @Param('phaseId', new ParseUUIDPipe()) phaseId: string,
    @Body() dto: CreateChecklistPhaseItemInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<ChecklistItemViewDto> {
    const itemId = await this.commandBus.execute<CreateItemCommand, string>(
      new CreateItemCommand(phaseId, dto, user.id),
    );
    return this.checklistQueryRepository.findItemViewByIdOrFail(itemId);
  }

  @Patch('phases/:phaseId/items/:itemId')
  async updateItem(
    @Param('phaseId', new ParseUUIDPipe()) phaseId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() dto: UpdateChecklistPhaseItemInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<ChecklistItemViewDto> {
    await this.commandBus.execute<UpdateItemCommand, void>(
      new UpdateItemCommand(phaseId, itemId, dto, user.id),
    );
    return this.checklistQueryRepository.findItemViewByIdOrFail(itemId);
  }

  @Patch('phases/:phaseId/items/:itemId/toggle')
  async toggleItemCompletion(
    @Param('phaseId', new ParseUUIDPipe()) phaseId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<ChecklistItemCompletionViewDto> {
    await this.commandBus.execute<ToggleItemCompletionCommand, void>(
      new ToggleItemCompletionCommand(phaseId, itemId, user.id),
    );
    return this.checklistQueryRepository.findItemCompletionViewByIdOrFail(
      itemId,
    );
  }

  @Delete('phases/:phaseId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteItem(
    @Param('phaseId', new ParseUUIDPipe()) phaseId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute<DeleteItemCommand, void>(
      new DeleteItemCommand(phaseId, itemId, user.id),
    );
  }

  @Patch('items/move')
  @HttpCode(HttpStatus.NO_CONTENT)
  async moveItem(
    @Body() dto: MoveItemInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute<MoveItemCommand, void>(
      new MoveItemCommand(dto, user.id),
    );
  }
}
