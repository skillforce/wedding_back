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
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ParseProfileImage } from './validators/parse-profile-image.decorator';
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { IdNumberParamDto } from '../../../core/decorators/validation/queryParamDto';
import { CreateUserInputDto } from './input-dto/create-user-input-dto';
import { CreateUserCommand } from '../application/usecases/create-user.usecase';
import { CreatePlainUserCommand } from '../application/usecases/create-plain-user.usecase';
import { CreatePlainUserInputDto } from './input-dto/create-plain-user.input-dto';
import { ValidateUserOwnershipCommand } from '../application/usecases/validate-user-ownership.usecase';
import { UsersQueryRepository } from '../infra/query/users.query-repository';
import { DeleteUserCommand } from '../application/usecases/delete-user.usecase';
import { UsersViewDto } from './view-dto/users.view-dto';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { RolesGuard } from '../guards/roles/roles.guard';
import { Roles } from '../guards/roles/roles.decorator';
import { UserRole } from '../domain/entities/user-role.enum';
import { ExtractUserFromRequest } from '../guards/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { UpdateProfileInputDto } from './input-dto/update-profile.input-dto';
import { UpdateProfileCommand } from '../application/usecases/update-profile.usecase';
import { UploadProfileImageCommand } from '../application/usecases/upload-profile-image.usecase';
import { ProfileViewDto } from './view-dto/profile.view-dto';
import { ResendConfirmationCommand } from '../application/usecases/resend-confirmation.usecase';
import { Locale } from '../../email/templates/confirmation-email.template';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private userQueryRepository: UsersQueryRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth()
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UsersViewDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createUser(@Body() dto: CreateUserInputDto): Promise<UsersViewDto> {
    const createdUserId = await this.commandBus.execute<
      CreateUserCommand,
      number
    >(new CreateUserCommand(dto));
    return this.userQueryRepository.findUserByIdOrNotFoundFail(createdUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(BasicAuthGuard)
  @ApiBasicAuth()
  @ApiOperation({ summary: 'Delete a user by ID (admin only)' })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param() { id }: IdNumberParamDto): Promise<void> {
    await this.userQueryRepository.findUserByIdOrNotFoundFail(id);
    return this.commandBus.execute<DeleteUserCommand, void>(
      new DeleteUserCommand(id),
    );
  }

  @Post('plain')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a plain user (superUser only)' })
  @ApiResponse({
    status: 201,
    description: 'Plain user created',
    type: UsersViewDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createPlainUser(
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() dto: CreatePlainUserInputDto,
  ): Promise<UsersViewDto> {
    const createdUserId = await this.commandBus.execute<
      CreatePlainUserCommand,
      number
    >(new CreatePlainUserCommand(dto, user.id));
    return this.userQueryRepository.findUserByIdOrNotFoundFail(createdUserId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_USER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List plain users created by the requesting superUser',
  })
  @ApiResponse({ status: 200, type: [UsersViewDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPlainUsers(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<UsersViewDto[]> {
    return this.userQueryRepository.findPlainUsersByCreatorId(user.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_USER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a plain user by ID (superUser only, must be creator)',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, type: UsersViewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPlainUserById(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param() { id }: IdNumberParamDto,
  ): Promise<UsersViewDto> {
    const effectiveUserId = await this.commandBus.execute<
      ValidateUserOwnershipCommand,
      number
    >(new ValidateUserOwnershipCommand(user.id, user.role, id));
    return this.userQueryRepository.findUserByIdOrNotFoundFail(effectiveUserId);
  }

  @Delete('plain/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_USER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a plain user (superUser only, must be creator)',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deletePlainUser(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param() { id }: IdNumberParamDto,
  ): Promise<void> {
    await this.commandBus.execute<ValidateUserOwnershipCommand, number>(
      new ValidateUserOwnershipCommand(user.id, user.role, id),
    );
    return this.commandBus.execute<DeleteUserCommand, void>(
      new DeleteUserCommand(id),
    );
  }

  @Post(':id/resend-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_USER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Resend confirmation email for a plain user (superUser only)',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 204, description: 'Confirmation email resent' })
  @ApiResponse({
    status: 400,
    description: 'User already confirmed or not found',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async resendConfirmation(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param() { id }: IdNumberParamDto,
    @Query('locale') locale?: Locale,
  ): Promise<void> {
    await this.commandBus.execute<ValidateUserOwnershipCommand, number>(
      new ValidateUserOwnershipCommand(user.id, user.role, id),
    );
    await this.commandBus.execute(new ResendConfirmationCommand(id, locale));
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: ProfileViewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @ExtractUserFromRequest() user: UserContextDto,
    @Body() dto: UpdateProfileInputDto,
  ): Promise<ProfileViewDto> {
    return this.commandBus.execute<UpdateProfileCommand, ProfileViewDto>(
      new UpdateProfileCommand(user.id, dto),
    );
  }

  @Patch('profile/image')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiResponse({ status: 200, type: ProfileViewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadProfileImage(
    @ExtractUserFromRequest() user: UserContextDto,
    @ParseProfileImage() file: Express.Multer.File,
  ): Promise<ProfileViewDto> {
    return this.commandBus.execute<UploadProfileImageCommand, ProfileViewDto>(
      new UploadProfileImageCommand(user.id, file.buffer, file.mimetype),
    );
  }

  @Patch(':id/profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_USER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update profile of a plain user (superUser only, must be creator)',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, type: ProfileViewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updatePlainUserProfile(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param() { id }: IdNumberParamDto,
    @Body() dto: UpdateProfileInputDto,
  ): Promise<ProfileViewDto> {
    const effectiveUserId = await this.commandBus.execute<
      ValidateUserOwnershipCommand,
      number
    >(new ValidateUserOwnershipCommand(user.id, user.role, id));
    return this.commandBus.execute<UpdateProfileCommand, ProfileViewDto>(
      new UpdateProfileCommand(effectiveUserId, dto),
    );
  }

  @Patch(':id/profile/image')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_USER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Upload profile image for a plain user (superUser only, must be creator)',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, type: ProfileViewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async uploadPlainUserProfileImage(
    @ExtractUserFromRequest() user: UserContextDto,
    @Param() { id }: IdNumberParamDto,
    @ParseProfileImage() file: Express.Multer.File,
  ): Promise<ProfileViewDto> {
    const effectiveUserId = await this.commandBus.execute<
      ValidateUserOwnershipCommand,
      number
    >(new ValidateUserOwnershipCommand(user.id, user.role, id));
    return this.commandBus.execute<UploadProfileImageCommand, ProfileViewDto>(
      new UploadProfileImageCommand(
        effectiveUserId,
        file.buffer,
        file.mimetype,
      ),
    );
  }
}
