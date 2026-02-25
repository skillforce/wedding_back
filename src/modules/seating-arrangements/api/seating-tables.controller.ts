import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { SeatingTablesQueryRepository } from '../infra/query/seating-tables.query-repository';
import { SeatingTableViewDto } from './view-dto/seating-table.view-dto';
import { CreateSeatingTableInputDto } from './input-dto/create-seating-table.input-dto';
import { UpdateSeatingTableInputDto } from './input-dto/update-seating-table.input-dto';
import { CreateSeatingTableCommand } from '../app/usecases/create-seating-table.usecase';
import { UpdateSeatingTableCommand } from '../app/usecases/update-seating-table.usecase';
import { DeleteSeatingTableCommand } from '../app/usecases/delete-seating-table.usecase';

@ApiTags('Seating tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 5000 } })
@Controller('seating-arrangements/tables')
export class SeatingTablesController {
  constructor(
    private readonly queryRepository: SeatingTablesQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all seating tables for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of seating tables',
    type: [SeatingTableViewDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllTables(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<SeatingTableViewDto[]> {
    return this.queryRepository.findAllByUserId(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new seating tables' })
  @ApiResponse({
    status: 201,
    description: 'Seating table created successfully',
    type: SeatingTableViewDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTable(
    @Body() dto: CreateSeatingTableInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<SeatingTableViewDto> {
    const tableId = await this.commandBus.execute<
      CreateSeatingTableCommand,
      string
    >(new CreateSeatingTableCommand(dto, user.id));
    return this.queryRepository.findByIdOrFail(tableId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing seating table' })
  @ApiParam({ name: 'id', description: 'Table UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Seating table updated successfully',
    type: SeatingTableViewDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - table does not belong to user',
  })
  @ApiResponse({ status: 404, description: 'Table not found' })
  async updateTable(
    @Param('id') id: string,
    @Body() dto: UpdateSeatingTableInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<SeatingTableViewDto> {
    await this.commandBus.execute<UpdateSeatingTableCommand, void>(
      new UpdateSeatingTableCommand(id, dto, user.id),
    );
    return this.queryRepository.findByIdOrFail(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a seating table by ID' })
  @ApiParam({ name: 'id', description: 'Table UUID', type: String })
  @ApiResponse({
    status: 204,
    description: 'Seating table deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - table does not belong to user',
  })
  @ApiResponse({ status: 404, description: 'Table not found' })
  async deleteTable(
    @Param('id') id: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute<DeleteSeatingTableCommand, void>(
      new DeleteSeatingTableCommand(id, user.id),
    );
  }
}
