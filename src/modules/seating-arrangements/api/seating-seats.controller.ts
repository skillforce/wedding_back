import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { SeatingSeatsQueryRepository } from '../infra/query/seating-seats.query-repository';
import { SeatingSeatViewDto } from './view-dto/seating-seat.view-dto';
import { CreateSeatingSeatInputDto } from './input-dto/create-seating-seat.input-dto';
import { CreateSeatingSeatCommand } from '../app/usecases/create-seating-seat.usecase';
import { DeleteSeatingSeatCommand } from '../app/usecases/delete-seating-seat.usecase';

@ApiTags('Seating Seats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('seating-arrangements/tables/:tableId/seats')
export class SeatingSeatsController {
  constructor(
    private readonly queryRepository: SeatingSeatsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a seat to a table' })
  @ApiParam({ name: 'tableId', description: 'Table UUID', type: String })
  @ApiResponse({
    status: 201,
    description: 'Seat created successfully',
    type: SeatingSeatViewDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Table not found' })
  async createSeat(
    @Param('tableId') tableId: string,
    @Body() dto: CreateSeatingSeatInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<SeatingSeatViewDto> {
    const seatId = await this.commandBus.execute<
      CreateSeatingSeatCommand,
      string
    >(new CreateSeatingSeatCommand(tableId, dto, user.id));
    return this.queryRepository.findByIdOrFail(seatId);
  }

  @Delete(':seatId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a seat from a table' })
  @ApiParam({ name: 'tableId', description: 'Table UUID', type: String })
  @ApiParam({ name: 'seatId', description: 'Seat UUID', type: String })
  @ApiResponse({ status: 204, description: 'Seat deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - seat does not belong to user',
  })
  @ApiResponse({ status: 404, description: 'Seat or table not found' })
  async deleteSeat(
    @Param('tableId') tableId: string,
    @Param('seatId') seatId: string,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    return this.commandBus.execute<DeleteSeatingSeatCommand, void>(
      new DeleteSeatingSeatCommand(seatId, tableId, user.id),
    );
  }
}
