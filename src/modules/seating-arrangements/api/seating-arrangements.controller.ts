import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { SeatingArrangementsQueryRepository } from '../infra/query/seating-arrangements.query-repository';
import { SeatingArrangementViewDto } from './view-dto/seating-arrangement.view-dto';
import { UpdateSeatingArrangementInputDto } from './input-dto/update-seating-arrangement.input-dto';
import { UpdateSeatingArrangementCommand } from '../app/usecases/update-seating-arrangement.usecase';

@ApiTags('Seating arrangements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 30, ttl: 5000 } })
@Controller('seating-arrangements/arrangement')
export class SeatingArrangementsController {
  constructor(
    private readonly queryRepository: SeatingArrangementsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Patch()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update seating arrangement workspace settings' })
  @ApiResponse({
    status: 200,
    description: 'Seating arrangement updated successfully',
    type: SeatingArrangementViewDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateArrangement(
    @Body() dto: UpdateSeatingArrangementInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<SeatingArrangementViewDto> {
    await this.commandBus.execute<UpdateSeatingArrangementCommand, void>(
      new UpdateSeatingArrangementCommand(dto, user.id),
    );
    return this.queryRepository.findByUserId(user.id);
  }
}