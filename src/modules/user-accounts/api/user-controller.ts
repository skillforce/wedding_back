import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ImageFileTypeValidator } from './validators/image-file-type.validator';
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
import { UsersQueryRepository } from '../infra/query/users.query-repository';
import { DeleteUserCommand } from '../application/usecases/delete-user.usecase';
import { UsersViewDto } from './view-dto/users.view-dto';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { ExtractUserFromRequest } from '../guards/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { UpdateProfileInputDto } from './input-dto/update-profile.input-dto';
import { UpdateProfileCommand } from '../application/usecases/update-profile.usecase';
import { UploadProfileImageCommand } from '../application/usecases/upload-profile-image.usecase';
import { ProfileViewDto } from './view-dto/profile.view-dto';

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
  async deleteUserById(@Param() { id }: IdNumberParamDto) {
    return this.commandBus.execute<DeleteUserCommand, void>(
      new DeleteUserCommand(id),
    );
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
    @UploadedFile(
      new ParseFilePipe({
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        validators: [
          new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 }),
          new ImageFileTypeValidator({}),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ProfileViewDto> {
    return this.commandBus.execute<UploadProfileImageCommand, ProfileViewDto>(
      new UploadProfileImageCommand(user.id, file.buffer, file.mimetype),
    );
  }
}
