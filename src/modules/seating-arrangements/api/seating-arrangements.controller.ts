import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { UserOwnershipGuard } from '../../user-accounts/guards/ownership/user-ownership.guard';
import { EffectiveUserId } from '../../user-accounts/guards/ownership/effective-user-id.decorator';
import { SeatingArrangementsQueryRepository } from '../infra/query/seating-arrangements.query-repository';
import { SeatingArrangementViewDto } from './view-dto/seating-arrangement.view-dto';
import { UpdateSeatingArrangementInputDto } from './input-dto/update-seating-arrangement.input-dto';
import { UpdateSeatingArrangementCommand } from '../app/usecases/update-seating-arrangement.usecase';
import { AutoSeatGuestsCommand } from '../app/usecases/auto-seat-guests.usecase';

@ApiTags('Seating arrangements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, UserOwnershipGuard)
@ApiQuery({ name: 'userId', required: false, type: Number })
@Throttle({ default: { limit: 30, ttl: 5000 } })
@Controller('seating-arrangements/arrangement')
export class SeatingArrangementsController {
  constructor(
    private readonly queryRepository: SeatingArrangementsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update seating arrangement workspace settings. SuperUsers may pass ?userId." })
  @ApiResponse({
    status: 200,
    description: 'Seating arrangement updated successfully',
    type: SeatingArrangementViewDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateArrangement(
    @Body() dto: UpdateSeatingArrangementInputDto,
    @EffectiveUserId() userId: number,
  ): Promise<SeatingArrangementViewDto> {
    await this.commandBus.execute<UpdateSeatingArrangementCommand, void>(
      new UpdateSeatingArrangementCommand(dto, userId),
    );
    return this.queryRepository.findByUserId(userId);
  }

  @Post('auto-seat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Auto-assign all guests to tables. SuperUsers may pass ?userId." })
  @ApiResponse({
    status: 200,
    description: 'Guests seated successfully',
    type: SeatingArrangementViewDto,
  })
  @ApiResponse({ status: 400, description: 'Capacity exceeded or invalid state' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async autoSeat(
    @EffectiveUserId() userId: number,
  ): Promise<SeatingArrangementViewDto> {
    await this.commandBus.execute<AutoSeatGuestsCommand, void>(
      new AutoSeatGuestsCommand(userId),
    );
    return this.queryRepository.findByUserId(userId);
  }
}