import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { LoginInputDto } from './input-dto/auth-input-dto';
import { ExtractUserFromRequest } from '../guards/extract-user-from-request.decorator';
import { UserContextDto } from '../guards/dto/user-context.dto';
import { UserRefreshContextDto } from '../guards/dto/user-refresh-context.dto';
import { LoginUserCommand } from '../application/usecases/login-user.usecase';
import { JwtAuthGuard } from '../guards/bearer/jwt-auth.guard';
import { RefreshTokenGuard } from '../guards/refresh/refresh-token.guard';
import { RefreshTokenCommand } from '../application/usecases/refresh-token.usecase';
import { LogoutCommand } from '../application/usecases/logout.usecase';
import { UsersQueryRepository } from '../infra/query/users.query-repository';
import { MeViewDto } from './view-dto/auth-view-dto';

const REFRESH_COOKIE = 'refreshToken';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none' as const,
};

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
    description: 'Returns a JWT access token and current user info',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        id: { type: 'number', example: 1 },
        login: { type: 'string', example: 'john' },
        invitationUrl: { type: 'string', nullable: true, example: null },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() _: LoginInputDto,
    @ExtractUserFromRequest() user: UserContextDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.commandBus.execute<
      LoginUserCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginUserCommand(user.id));

    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);

    const me = await this.usersQueryRepository.findMeByIdOrNotFoundFail(user.id);

    return { accessToken, ...me };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshTokenGuard)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({
    status: 200,
    description: 'Returns a new JWT access token',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  async refresh(
    @Req() req: Request & { user: UserRefreshContextDto; refreshToken: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.commandBus.execute<
      RefreshTokenCommand,
      { accessToken: string; refreshToken: string }
    >(new RefreshTokenCommand(req.user.id, req.user.tokenId, req.refreshToken));

    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);

    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenGuard)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  async logout(
    @Req() req: Request & { user: UserRefreshContextDto },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.commandBus.execute(new LogoutCommand(req.user.tokenId));
    res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
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