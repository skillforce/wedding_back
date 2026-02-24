import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { LoginInputDto } from './input-dto/auth-input-dto';
import { ExtractUserFromRequest } from '../guards/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { LoginUserCommand } from '../application/usecases/login-user.usecase';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { UsersQueryRepository } from '../infra/query/users.query-repository';
import { MeViewDto } from './view-dto/auth-view-dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login with login and password' })
  @ApiResponse({
    status: 200,
    description: 'Returns a JWT access token',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() _: LoginInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
    @Res({ passthrough: true })
    res: Response,
  ) {
    return this.commandBus.execute<LoginUserCommand, { accessToken: string }>(
      new LoginUserCommand(user.id),
    );
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user info', type: MeViewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(
    @ExtractUserFromRequest() user: UserContextDto,
  ): Promise<MeViewDto> {
    return this.usersQueryRepository.findMeByIdOrNotFoundFail(user.id);
  }
}