import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { GuestDetailViewDto } from './view-dto/guest-detail.view-dto';
import { CreateGuestInputDto } from './input-dto/guest.input-dto';
import { CreateGuestCommand } from '../app/usecases/create-guest.usecase';
import { DeleteGuestCommand } from '../app/usecases/delete-guest.usecase';
import { UpdateGuestFormCommand } from '../app/usecases/update-guest-form.usecase';
import { UpdateGuestFormInputDto } from './input-dto/update-guest-form.input-dto';
import { IdUuidParamDto } from '../../../core/decorators/validation/queryParamDto';
import { JwtAuthGuard } from '../../user-accounts/guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../../user-accounts/guards/extract-user-from-request.decorator';
import { UserContextDto } from '../../user-accounts/guards/dto/user-context.dto';

@ApiTags('Guests')
@ApiBearerAuth()
@Controller('guests')
export class GuestsController {
  constructor(
    private readonly guestsQueryRepository: GuestsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all guests for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of guests',
    type: [GuestDetailViewDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllGuests(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GuestDetailViewDto[]> {
    return this.guestsQueryRepository.findAllGuestsByUserId(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a guest by ID with response details' })
  @ApiParam({ name: 'id', description: 'Guest UUID' })
  @ApiResponse({
    status: 200,
    description: 'Guest found',
    type: GuestDetailViewDto,
  })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  async getGuestById(
    @Param() { id }: IdUuidParamDto,
  ): Promise<GuestDetailViewDto> {
    return this.guestsQueryRepository.findGuestDetailById(id);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new guest' })
  @ApiResponse({
    status: 201,
    description: 'Guest created successfully',
    type: GuestDetailViewDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createGuest(@Body() dto: CreateGuestInputDto): Promise<GuestDetailViewDto> {
    const newGuestId = await this.commandBus.execute<
      CreateGuestCommand,
      string
    >(new CreateGuestCommand(dto));
    return this.guestsQueryRepository.findGuestDetailById(newGuestId);
  }

  @Patch(':id/form')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update guest form (profile data)' })
  @ApiParam({ name: 'id', description: 'Guest UUID' })
  @ApiResponse({
    status: 200,
    description: 'Guest form updated',
    type: GuestDetailViewDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - guest does not belong to user' })
  @ApiResponse({ status: 404, description: 'Guest or guest form not found' })
  async updateGuestForm(
    @Param() { id }: IdUuidParamDto,
    @Body() dto: UpdateGuestFormInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<GuestDetailViewDto> {
    await this.commandBus.execute<UpdateGuestFormCommand, void>(
      new UpdateGuestFormCommand(id, dto, user.id),
    );
    return this.guestsQueryRepository.findGuestDetailById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a guest by ID' })
  @ApiParam({ name: 'id', description: 'Guest UUID' })
  @ApiResponse({ status: 204, description: 'Guest deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - guest does not belong to user',
  })
  @ApiResponse({ status: 404, description: 'Guest not found' })
  async deleteGuestById(
    @Param() { id }: IdUuidParamDto,
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<void> {
    await this.commandBus.execute<DeleteGuestCommand, void>(
      new DeleteGuestCommand(id, user.id),
    );
  }
}
