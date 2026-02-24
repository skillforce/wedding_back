import {
  Body,
  Controller,
  Delete,
  Get,
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
import { GuestsQueryRepository } from '../infra/query/guests.query-repository';
import { GuestsViewDto } from './view-dto/guests.view-dto';
import { CreateGuestInputDto } from './input-dto/guest.input-dto';
import { CreateGuestCommand } from '../app/usecases/create-guest.usecase';
import { DeleteGuestCommand } from '../app/usecases/delete-guest.usecase';
import { IdNumberParamDto } from '../../../core/decorators/validation/queryParamDto';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Guests')
@ApiBearerAuth()
@Throttle({ default: { limit: 10, ttl: 5000 } })
@Controller('guests')
export class GuestsController {
  constructor(
    private readonly guestsQueryRepository: GuestsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('')
  @ApiOperation({ summary: 'Get all guests for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of guests', type: [GuestsViewDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllGuests(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GuestsViewDto[]> {
    return await this.guestsQueryRepository.findAllGuestsByUserId(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new guest' })
  @ApiResponse({ status: 201, description: 'Guest created successfully', type: GuestsViewDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createGuest(@Body() dto: CreateGuestInputDto) {
    const newGuestId = await this.commandBus.execute<
      CreateGuestCommand,
      number
    >(new CreateGuestCommand(dto));

    return this.guestsQueryRepository.findGuestsById(newGuestId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a guest by ID' })
  @ApiParam({ name: 'id', description: 'Guest ID', type: Number })
  @ApiResponse({ status: 204, description: 'Guest deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - guest does not belong to user' })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  async deleteGuestById(
    @Param() { id }: IdNumberParamDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ) {
    return this.commandBus.execute<DeleteGuestCommand, void>(
      new DeleteGuestCommand(id, user.id),
    );
  }
}