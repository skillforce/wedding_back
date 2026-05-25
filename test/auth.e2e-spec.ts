import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { initTesting } from './helpers/initTesting';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { getOptionsToken } from '@nestjs/throttler';
import { UserRole } from '../src/modules/user-accounts/domain/entities/user-role.enum';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;
  let mockResendAdapter: { send: jest.Mock };

  beforeAll(async () => {
    const result = await initTesting((moduleBuilder) =>
      moduleBuilder
        .overrideProvider(getOptionsToken())
        .useValue([{ ttl: 10000, limit: 9999 }])
        .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
        .useFactory({
          factory: (userAccountsConfig: UserAccountsConfig) => {
            return new JwtService({
              secret: userAccountsConfig.accessTokenSecret,
              signOptions: {
                expiresIn: userAccountsConfig.accessTokenExpireIn,
              },
            });
          },
          inject: [UserAccountsConfig],
        })
        .overrideProvider(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
        .useFactory({
          factory: (userAccountsConfig: UserAccountsConfig) => {
            return new JwtService({
              secret: userAccountsConfig.refreshTokenSecret,
              signOptions: {
                expiresIn: userAccountsConfig.refreshTokenExpireIn as any,
              },
            });
          },
          inject: [UserAccountsConfig],
        }),
    );
    app = result.app;
    mockResendAdapter = result.mockResendAdapter;
    userAccountsTestManager = result.userAccountsTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should create user and login', async () => {
    const credentials = userAccountsTestManager.buildCreateUserDto();

    const createUserResponse =
      await userAccountsTestManager.createUser(credentials);
    expect(createUserResponse).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        login: credentials.login,
      }),
    );

    const { body, refreshTokenCookie } =
      await userAccountsTestManager.login(credentials);

    expect(body).toEqual({
      accessToken: expect.any(String),
      deviceId: expect.any(String),
      id: expect.any(Number),
      login: credentials.login,
      profile: {
        invitationUrl: null,
        isCreatedBySuperUser: false,
        isSuperUser: false,
        isConfirmed: true,
        profileImg: null,
        weddingDate: null,
        email: credentials.email,
      },
    });
    expect(refreshTokenCookie).toBeDefined();
    expect(refreshTokenCookie).toContain('HttpOnly');
  });

  it('should return current user in me request', async () => {
    const { credentials, userId, accessToken } =
      await userAccountsTestManager.createUserAndLogin();

    const meResponse = await userAccountsTestManager.me(accessToken);

    expect(meResponse).toEqual({
      id: userId,
      login: credentials.login,
      profile: {
        invitationUrl: null,
        profileImg: null,
        isCreatedBySuperUser: false,
        isSuperUser: false,
        isConfirmed: true,
        weddingDate: null,
        email: credentials.email,
      },
    });
  });

  it('should refresh tokens and return new access token', async () => {
    const { refreshTokenCookie } =
      await userAccountsTestManager.createUserAndLogin();

    const { body, refreshTokenCookie: newCookie } =
      await userAccountsTestManager.refresh(refreshTokenCookie);

    expect(body).toEqual({ accessToken: expect.any(String) });
    expect(newCookie).toBeDefined();
    expect(newCookie).not.toEqual(refreshTokenCookie);
  });

  it('should reject second refresh with the same refresh token (rotation)', async () => {
    const { refreshTokenCookie } =
      await userAccountsTestManager.createUserAndLogin();

    await userAccountsTestManager.refresh(refreshTokenCookie);

    await userAccountsTestManager.refresh(
      refreshTokenCookie,
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('should logout and reject subsequent refresh', async () => {
    const { refreshTokenCookie } =
      await userAccountsTestManager.createUserAndLogin();

    await userAccountsTestManager.logout(refreshTokenCookie);

    await userAccountsTestManager.refresh(
      refreshTokenCookie,
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('should reject duplicate user login', async () => {
    const credentials = userAccountsTestManager.buildCreateUserDto();

    await userAccountsTestManager.createUser(credentials);

    const duplicateResponse = await userAccountsTestManager.createUser(
      credentials,
      HttpStatus.BAD_REQUEST,
    );
    expect(duplicateResponse).toEqual({
      errorsMessages: [
        {
          field: 'login or email',
          message: 'login or email is already in use',
        },
      ],
    });
  });

  it('should reject login with invalid password', async () => {
    const credentials = userAccountsTestManager.buildCreateUserDto();
    await userAccountsTestManager.createUser(credentials);

    const { body } = await userAccountsTestManager.login(
      {
        loginOrEmail: credentials.login,
        password: 'wrong-pass',
      },
      HttpStatus.UNAUTHORIZED,
    );

    expect(body).toEqual({
      errorsMessages: [
        {
          field: 'login',
          message: 'Invalid login or password',
        },
        {
          field: 'password',
          message: 'Invalid login or password',
        },
      ],
    });
  });

  it('should delete user and reject next login', async () => {
    const superUserDto = userAccountsTestManager.buildCreateUserDto({
      role: UserRole.SUPER_USER,
    });
    const superUser = await userAccountsTestManager.createUser(superUserDto);
    const { body: superUserBody } =
      await userAccountsTestManager.login(superUserDto);

    const plainUserDto = userAccountsTestManager.buildCreatePlainUserDto();
    const plainUser = await userAccountsTestManager.createActivatedPlainUser(
      superUser.id,
      plainUserDto,
    );

    await userAccountsTestManager.deletePlainUserById(
      plainUser.id,
      superUserBody.accessToken,
    );

    await userAccountsTestManager.login(plainUserDto, HttpStatus.UNAUTHORIZED);
  });

  it('login response should includ    <UserManagementCreateDialog v-model:visible="createDialogVisible" />e deviceId', async () => {
    const credentials = userAccountsTestManager.buildCreateUserDto();
    await userAccountsTestManager.createUser(credentials);

    const { body } = await userAccountsTestManager.login(credentials);

    expect(body.deviceId).toBeDefined();
    expect(typeof body.deviceId).toBe('string');
  });

  it('should return the provided deviceId when X-Device-Id header is sent', async () => {
    const credentials = userAccountsTestManager.buildCreateUserDto();
    await userAccountsTestManager.createUser(credentials);
    const customDeviceId = '11111111-1111-1111-1111-111111111111';
    const { body } = await userAccountsTestManager.login(
      credentials,
      HttpStatus.OK,
      customDeviceId,
    );

    expect(body.deviceId).toBe(customDeviceId);
  });

  describe('super user creation', () => {
    it('should create a super user via admin endpoint', async () => {
      const dto = userAccountsTestManager.buildCreateUserDto({
        role: UserRole.SUPER_USER,
      });

      const response = await userAccountsTestManager.createUser(dto);

      expect(response).toEqual(
        expect.objectContaining({ id: expect.any(Number), login: dto.login }),
      );
    });

    it('should allow super user to login after creation', async () => {
      const dto = userAccountsTestManager.buildCreateUserDto({
        role: UserRole.SUPER_USER,
      });
      await userAccountsTestManager.createUser(dto);

      const { body } = await userAccountsTestManager.login(dto);

      expect(body.accessToken).toBeDefined();
    });

    it('should reject super user creation with duplicate login', async () => {
      const dto = userAccountsTestManager.buildCreateUserDto({
        role: UserRole.SUPER_USER,
      });
      await userAccountsTestManager.createUser(dto);

      const response = await userAccountsTestManager.createUser(
        dto,
        HttpStatus.BAD_REQUEST,
      );

      expect(response).toEqual({
        errorsMessages: [
          { field: 'login or email', message: 'login or email is already in use' },
        ],
      });
    });

    it('should reject super user creation with invalid basic auth credentials', async () => {
      const dto = userAccountsTestManager.buildCreateUserDto({
        role: UserRole.SUPER_USER,
      });

      await userAccountsTestManager.createUser(dto, HttpStatus.UNAUTHORIZED, {
        username: 'wrong',
        password: 'wrong',
      });
    });
  });

  describe('plain user email uniqueness across super users', () => {
    it("should reject plain user creation with email already used by another super user's plain user", async () => {
      const superUser1Dto = userAccountsTestManager.buildCreateUserDto({
        role: UserRole.SUPER_USER,
      });
      await userAccountsTestManager.createUser(superUser1Dto);
      const { body: body1 } =
        await userAccountsTestManager.login(superUser1Dto);

      const superUser2Dto = userAccountsTestManager.buildCreateUserDto({
        role: UserRole.SUPER_USER,
      });
      await userAccountsTestManager.createUser(superUser2Dto);
      const { body: body2 } =
        await userAccountsTestManager.login(superUser2Dto);

      const sharedEmail = `shared${Date.now()}@example.com`;
      const plainDto1 = userAccountsTestManager.buildCreatePlainUserDto({
        email: sharedEmail,
      });
      await userAccountsTestManager.createPlainUser(
        body1.accessToken,
        plainDto1,
      );

      const plainDto2 = userAccountsTestManager.buildCreatePlainUserDto({
        email: sharedEmail,
      });
      const response = await userAccountsTestManager.createPlainUser(
        body2.accessToken,
        plainDto2,
        HttpStatus.BAD_REQUEST,
      );

      expect(response).toEqual(
        expect.objectContaining({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: 'login or email is already in use',
            }),
          ]),
        }),
      );
    });
  });

  describe('session management', () => {
    it('GET /auth/sessions should return the active session', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const sessions = await userAccountsTestManager.getSessions(accessToken);

      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          isCurrent: true,
          lastActiveAt: expect.any(String),
          createdAt: expect.any(String),
        }),
      );
    });

    it('should create separate sessions for different devices', async () => {
      const credentials = userAccountsTestManager.buildCreateUserDto();
      await userAccountsTestManager.createUser(credentials);

      await userAccountsTestManager.login(
        credentials,
        HttpStatus.OK,
        'device-aaa-0000-0000-0000-000000000001',
      );
      const { body: body2 } = await userAccountsTestManager.login(
        credentials,
        HttpStatus.OK,
        'device-bbb-0000-0000-0000-000000000002',
      );

      const sessions = await userAccountsTestManager.getSessions(
        body2.accessToken,
      );

      expect(sessions).toHaveLength(2);
      expect(sessions.find((s: any) => s.isCurrent)).toBeDefined();
    });

    it('should replace existing session on re-login from same device', async () => {
      const credentials = userAccountsTestManager.buildCreateUserDto();
      await userAccountsTestManager.createUser(credentials);
      const deviceId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

      await userAccountsTestManager.login(credentials, HttpStatus.OK, deviceId);
      const { body } = await userAccountsTestManager.login(
        credentials,
        HttpStatus.OK,
        deviceId,
      );

      const sessions = await userAccountsTestManager.getSessions(
        body.accessToken,
      );

      expect(sessions).toHaveLength(1);
    });

    it('DELETE /auth/sessions/:id should revoke a specific session', async () => {
      const credentials = userAccountsTestManager.buildCreateUserDto();
      await userAccountsTestManager.createUser(credentials);

      const { refreshTokenCookie: cookie1 } =
        await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          'device-ccc-0000-0000-0000-000000000003',
        );
      const { body: body2 } = await userAccountsTestManager.login(
        credentials,
        HttpStatus.OK,
        'device-ddd-0000-0000-0000-000000000004',
      );

      const sessions = await userAccountsTestManager.getSessions(
        body2.accessToken,
      );
      const otherSession = sessions.find((s: any) => !s.isCurrent);

      await userAccountsTestManager.revokeSession(
        body2.accessToken,
        otherSession.id,
      );

      await userAccountsTestManager.refresh(cookie1!, HttpStatus.UNAUTHORIZED);
    });

    it('DELETE /auth/sessions should revoke all other sessions', async () => {
      const credentials = userAccountsTestManager.buildCreateUserDto();
      await userAccountsTestManager.createUser(credentials);

      const { refreshTokenCookie: cookie1 } =
        await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          'device-eee-0000-0000-0000-000000000005',
        );
      const { refreshTokenCookie: cookie2 } =
        await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          'device-fff-0000-0000-0000-000000000006',
        );
      const { body: currentBody } = await userAccountsTestManager.login(
        credentials,
        HttpStatus.OK,
        'device-ggg-0000-0000-0000-000000000007',
      );

      await userAccountsTestManager.revokeAllOtherSessions(
        currentBody.accessToken,
      );

      const sessions = await userAccountsTestManager.getSessions(
        currentBody.accessToken,
      );
      expect(sessions).toHaveLength(1);
      expect(sessions[0].isCurrent).toBe(true);

      await userAccountsTestManager.refresh(cookie1!, HttpStatus.UNAUTHORIZED);
      await userAccountsTestManager.refresh(cookie2!, HttpStatus.UNAUTHORIZED);
    });

    it('should return 404 when revoking a session that does not belong to the user', async () => {
      const { accessToken: token1 } =
        await userAccountsTestManager.createUserAndLogin();
      const { accessToken: token2 } =
        await userAccountsTestManager.createUserAndLogin();

      const sessions1 = await userAccountsTestManager.getSessions(token1);
      const foreignSessionId = sessions1[0].id;

      await userAccountsTestManager.revokeSession(
        token2,
        foreignSessionId,
        HttpStatus.NOT_FOUND,
      );
    });

    describe('plain user flow', () => {
      let superUserAccessToken: string;

      beforeEach(async () => {
        mockResendAdapter.send.mockClear();
        const dto = userAccountsTestManager.buildCreateUserDto({
          role: UserRole.SUPER_USER,
        });
        await userAccountsTestManager.createUser(dto);
        const { body } = await userAccountsTestManager.login(dto);
        superUserAccessToken = body.accessToken;
      });

      it('should create plain user and send confirmation email', async () => {
        const dto = userAccountsTestManager.buildCreatePlainUserDto();

        const plainUser = await userAccountsTestManager.createPlainUser(
          superUserAccessToken,
          dto,
        );

        expect(plainUser).toEqual(
          expect.objectContaining({ id: expect.any(Number), login: dto.login }),
        );

        await new Promise((r) => setImmediate(r));

        expect(mockResendAdapter.send).toHaveBeenCalledTimes(1);
        expect(mockResendAdapter.send).toHaveBeenCalledWith(
          expect.objectContaining({
            to: dto.email,
            subject: 'Confirm your email',
          }),
        );
      });

      it('should confirm email and allow login', async () => {
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createPlainUser(
          superUserAccessToken,
          dto,
        );

        await new Promise((r) => setImmediate(r));

        const emailCall = mockResendAdapter.send.mock.calls[0][0];
        const token = userAccountsTestManager.extractTokenFromEmailHtml(
          emailCall.html,
        );

        await userAccountsTestManager.confirmEmail(token);

        const { body } = await userAccountsTestManager.login(dto);
        expect(body.accessToken).toBeDefined();
      });

      it('should reject login before email is confirmed', async () => {
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createPlainUser(
          superUserAccessToken,
          dto,
        );

        await userAccountsTestManager.login(dto, HttpStatus.UNAUTHORIZED);
      });

      it('should reject plain user creation with duplicate email', async () => {
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createPlainUser(
          superUserAccessToken,
          dto,
        );

        const dto2 = userAccountsTestManager.buildCreatePlainUserDto({
          email: dto.email,
        });
        const response = await userAccountsTestManager.createPlainUser(
          superUserAccessToken,
          dto2,
          HttpStatus.BAD_REQUEST,
        );

        expect(response).toEqual(
          expect.objectContaining({
            errorsMessages: expect.arrayContaining([
              expect.objectContaining({
                message: 'login or email is already in use',
              }),
            ]),
          }),
        );
      });

      it('should reject plain user creation with duplicate login', async () => {
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createPlainUser(
          superUserAccessToken,
          dto,
        );

        const dto2 = userAccountsTestManager.buildCreatePlainUserDto({
          login: dto.login,
        });
        const response = await userAccountsTestManager.createPlainUser(
          superUserAccessToken,
          dto2,
          HttpStatus.BAD_REQUEST,
        );

        expect(response).toEqual(
          expect.objectContaining({
            errorsMessages: expect.arrayContaining([
              expect.objectContaining({
                message: 'login or email is already in use',
              }),
            ]),
          }),
        );
      });

      it('should reject expired confirmation token', async () => {
        await userAccountsTestManager.confirmEmail(
          '00000000-0000-0000-0000-000000000000',
          HttpStatus.BAD_REQUEST,
        );
      });

      it('should send confirmation email in Russian when locale=ru', async () => {
        const dto = userAccountsTestManager.buildCreatePlainUserDto({
          locale: 'ru',
        });

        await userAccountsTestManager.createPlainUser(
          superUserAccessToken,
          dto,
        );
        await new Promise((r) => setImmediate(r));

        expect(mockResendAdapter.send).toHaveBeenCalledWith(
          expect.objectContaining({
            to: dto.email,
            subject: 'Подтвердите вашу почту',
          }),
        );
      });

      it('should send confirmation email in English by default when no locale provided', async () => {
        const dto = userAccountsTestManager.buildCreatePlainUserDto();

        await userAccountsTestManager.createPlainUser(
          superUserAccessToken,
          dto,
        );
        await new Promise((r) => setImmediate(r));

        expect(mockResendAdapter.send).toHaveBeenCalledWith(
          expect.objectContaining({
            to: dto.email,
            subject: 'Confirm your email',
          }),
        );
      });

      it('should resend confirmation email with default locale', async () => {
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        const plainUser = await userAccountsTestManager.createPlainUser(
          superUserAccessToken,
          dto,
        );

        mockResendAdapter.send.mockClear();

        await userAccountsTestManager.resendConfirmation(
          superUserAccessToken,
          plainUser.id,
        );
        await new Promise((r) => setImmediate(r));

        expect(mockResendAdapter.send).toHaveBeenCalledTimes(1);
        expect(mockResendAdapter.send).toHaveBeenCalledWith(
          expect.objectContaining({
            to: dto.email,
            subject: 'Confirm your email',
          }),
        );
      });

      it('should resend confirmation email in Russian when locale=ru query param is passed', async () => {
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        const plainUser = await userAccountsTestManager.createPlainUser(
          superUserAccessToken,
          dto,
        );

        mockResendAdapter.send.mockClear();

        await userAccountsTestManager.resendConfirmation(
          superUserAccessToken,
          plainUser.id,
          'ru',
        );
        await new Promise((r) => setImmediate(r));

        expect(mockResendAdapter.send).toHaveBeenCalledTimes(1);
        expect(mockResendAdapter.send).toHaveBeenCalledWith(
          expect.objectContaining({
            to: dto.email,
            subject: 'Подтвердите вашу почту',
          }),
        );
      });

      describe('super user manages plain user profile', () => {
        it('should allow super user to update profile of their plain user', async () => {
          const superUserDto = userAccountsTestManager.buildCreateUserDto({
            role: UserRole.SUPER_USER,
          });
          const superUser =
            await userAccountsTestManager.createUser(superUserDto);
          const { body: superUserBody } =
            await userAccountsTestManager.login(superUserDto);

          const plainUserDto =
            userAccountsTestManager.buildCreatePlainUserDto();
          const plainUser =
            await userAccountsTestManager.createActivatedPlainUser(
              superUser.id,
              plainUserDto,
            );

          const profileUpdate = {
            invitationUrl: 'https://example.com/invite/abc123',
            weddingDate: '2026-09-01',
            email: plainUserDto.email,
          };

          const updatedProfile =
            await userAccountsTestManager.updatePlainUserProfile(
              superUserBody.accessToken,
              plainUser.id,
              profileUpdate,
            );

          expect(updatedProfile).toEqual(
            expect.objectContaining({
              invitationUrl: profileUpdate.invitationUrl,
              weddingDate: expect.any(String),
              email: profileUpdate.email,
              isCreatedBySuperUser: true,
              isSuperUser: false,
              isConfirmed: true,
            }),
          );
        });

        it("should return 403 when super user tries to update profile of another super user's plain user", async () => {
          const superUser1Dto = userAccountsTestManager.buildCreateUserDto({
            role: UserRole.SUPER_USER,
          });
          const superUser1 =
            await userAccountsTestManager.createUser(superUser1Dto);

          const superUser2Dto = userAccountsTestManager.buildCreateUserDto({
            role: UserRole.SUPER_USER,
          });
          await userAccountsTestManager.createUser(superUser2Dto);
          const { body: superUser2Body } =
            await userAccountsTestManager.login(superUser2Dto);

          const plainUserDto =
            userAccountsTestManager.buildCreatePlainUserDto();
          const plainUser =
            await userAccountsTestManager.createActivatedPlainUser(
              superUser1.id,
              plainUserDto,
            );

          await userAccountsTestManager.updatePlainUserProfile(
            superUser2Body.accessToken,
            plainUser.id,
            { invitationUrl: 'https://example.com' },
            HttpStatus.FORBIDDEN,
          );
        });

        it('should return 403 when super user tries to update profile of a non-existent user', async () => {
          await userAccountsTestManager.updatePlainUserProfile(
            superUserAccessToken,
            999999,
            { invitationUrl: 'https://example.com' },
            HttpStatus.FORBIDDEN,
          );
        });
      });
    });

    describe('forgot password / reset password flow', () => {
      let superUserAccessToken: string;

      beforeEach(async () => {
        mockResendAdapter.send.mockClear();
        const dto = userAccountsTestManager.buildCreateUserDto({
          role: UserRole.SUPER_USER,
        });
        await userAccountsTestManager.createUser(dto);
        const { body } = await userAccountsTestManager.login(dto);
        superUserAccessToken = body.accessToken;
      });

      it('should return 204 for unknown email (no enumeration)', async () => {
        await userAccountsTestManager.forgotPassword('nonexistent@example.com');
        await new Promise((r) => setImmediate(r));
        expect(mockResendAdapter.send).not.toHaveBeenCalled();
      });

      it('should return 204 for unconfirmed email and not send reset email', async () => {
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createPlainUser(
          superUserAccessToken,
          dto,
        );
        mockResendAdapter.send.mockClear();

        await userAccountsTestManager.forgotPassword(dto.email);
        await new Promise((r) => setImmediate(r));
        expect(mockResendAdapter.send).not.toHaveBeenCalled();
      });

      it('should send reset email for confirmed user', async () => {
        const superUserDto = userAccountsTestManager.buildCreateUserDto({
          role: UserRole.SUPER_USER,
        });
        const superUser =
          await userAccountsTestManager.createUser(superUserDto);
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createActivatedPlainUser(
          superUser.id,
          dto,
        );
        mockResendAdapter.send.mockClear();

        await userAccountsTestManager.forgotPassword(dto.email);
        await new Promise((r) => setImmediate(r));

        expect(mockResendAdapter.send).toHaveBeenCalledTimes(1);
        expect(mockResendAdapter.send).toHaveBeenCalledWith(
          expect.objectContaining({
            to: dto.email,
            subject: 'Reset your password',
          }),
        );
      });

      it('old password still works while reset token is pending', async () => {
        const superUserDto = userAccountsTestManager.buildCreateUserDto({
          role: UserRole.SUPER_USER,
        });
        const superUser =
          await userAccountsTestManager.createUser(superUserDto);
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createActivatedPlainUser(
          superUser.id,
          dto,
        );
        mockResendAdapter.send.mockClear();

        await userAccountsTestManager.forgotPassword(dto.email);
        await new Promise((r) => setImmediate(r));

        const { body } = await userAccountsTestManager.login(dto);
        expect(body.accessToken).toBeDefined();
      });

      it('should reset password and allow login with new password', async () => {
        const superUserDto = userAccountsTestManager.buildCreateUserDto({
          role: UserRole.SUPER_USER,
        });
        const superUser =
          await userAccountsTestManager.createUser(superUserDto);
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createActivatedPlainUser(
          superUser.id,
          dto,
        );
        mockResendAdapter.send.mockClear();

        await userAccountsTestManager.forgotPassword(dto.email);
        await new Promise((r) => setImmediate(r));

        const resetToken = userAccountsTestManager.extractTokenFromEmailHtml(
          mockResendAdapter.send.mock.calls[0][0].html,
        );
        const newPassword = 'newpassword99';

        await userAccountsTestManager.resetPassword(resetToken, newPassword);

        const { body } = await userAccountsTestManager.login({
          ...dto,
          password: newPassword,
        });
        expect(body.accessToken).toBeDefined();
      });

      it('old password no longer works after reset', async () => {
        const superUserDto = userAccountsTestManager.buildCreateUserDto({
          role: UserRole.SUPER_USER,
        });
        const superUser =
          await userAccountsTestManager.createUser(superUserDto);
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createActivatedPlainUser(
          superUser.id,
          dto,
        );
        mockResendAdapter.send.mockClear();

        await userAccountsTestManager.forgotPassword(dto.email);
        await new Promise((r) => setImmediate(r));

        const resetToken = userAccountsTestManager.extractTokenFromEmailHtml(
          mockResendAdapter.send.mock.calls[0][0].html,
        );
        await userAccountsTestManager.resetPassword(resetToken, 'newpassword99');

        await userAccountsTestManager.login(dto, HttpStatus.UNAUTHORIZED);
      });

      it('should revoke all sessions after successful password reset', async () => {
        const superUserDto = userAccountsTestManager.buildCreateUserDto({
          role: UserRole.SUPER_USER,
        });
        const superUser =
          await userAccountsTestManager.createUser(superUserDto);
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createActivatedPlainUser(
          superUser.id,
          dto,
        );

        const { refreshTokenCookie } =
          await userAccountsTestManager.login(dto);
        mockResendAdapter.send.mockClear();

        await userAccountsTestManager.forgotPassword(dto.email);
        await new Promise((r) => setImmediate(r));

        const resetToken = userAccountsTestManager.extractTokenFromEmailHtml(
          mockResendAdapter.send.mock.calls[0][0].html,
        );
        await userAccountsTestManager.resetPassword(resetToken, 'newpassword99');

        await userAccountsTestManager.refresh(
          refreshTokenCookie!,
          HttpStatus.UNAUTHORIZED,
        );
      });

      it('should reject expired or unknown reset token', async () => {
        await userAccountsTestManager.resetPassword(
          '00000000-0000-0000-0000-000000000000',
          'newpassword99',
          HttpStatus.BAD_REQUEST,
        );
      });

      it('should reject already-consumed reset token', async () => {
        const superUserDto = userAccountsTestManager.buildCreateUserDto({
          role: UserRole.SUPER_USER,
        });
        const superUser =
          await userAccountsTestManager.createUser(superUserDto);
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createActivatedPlainUser(
          superUser.id,
          dto,
        );

        mockResendAdapter.send.mockClear();

        await userAccountsTestManager.forgotPassword(dto.email);
        await new Promise((r) => setImmediate(r));

        const resetToken = userAccountsTestManager.extractTokenFromEmailHtml(
          mockResendAdapter.send.mock.calls[0][0].html,
        );
        await userAccountsTestManager.resetPassword(resetToken, 'newpassword99');

        await userAccountsTestManager.resetPassword(
          resetToken,
          'anotherpassword1',
          HttpStatus.BAD_REQUEST,
        );
      });

      it('second forgot-password request invalidates the first token', async () => {
        const superUserDto = userAccountsTestManager.buildCreateUserDto({
          role: UserRole.SUPER_USER,
        });
        const superUser =
          await userAccountsTestManager.createUser(superUserDto);
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createActivatedPlainUser(
          superUser.id,
          dto,
        );
        mockResendAdapter.send.mockClear();

        await userAccountsTestManager.forgotPassword(dto.email);
        await new Promise((r) => setImmediate(r));
        const firstToken = userAccountsTestManager.extractTokenFromEmailHtml(
          mockResendAdapter.send.mock.calls[0][0].html,
        );

        mockResendAdapter.send.mockClear();
        await userAccountsTestManager.forgotPassword(dto.email);
        await new Promise((r) => setImmediate(r));

        await userAccountsTestManager.resetPassword(
          firstToken,
          'newpassword99',
          HttpStatus.BAD_REQUEST,
        );
      });

      it('reset token should not be accepted on confirm-email endpoint', async () => {
        const superUserDto = userAccountsTestManager.buildCreateUserDto({
          role: UserRole.SUPER_USER,
        });
        const superUser =
          await userAccountsTestManager.createUser(superUserDto);
        const dto = userAccountsTestManager.buildCreatePlainUserDto();
        await userAccountsTestManager.createActivatedPlainUser(
          superUser.id,
          dto,
        );
        mockResendAdapter.send.mockClear();

        await userAccountsTestManager.forgotPassword(dto.email);
        await new Promise((r) => setImmediate(r));
        const resetToken = userAccountsTestManager.extractTokenFromEmailHtml(
          mockResendAdapter.send.mock.calls[0][0].html,
        );

        await userAccountsTestManager.confirmEmail(
          resetToken,
          HttpStatus.BAD_REQUEST,
        );
      });
    });

    describe('User-Agent and deviceName', () => {
      const UA_CHROME_MACOS =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
      const UA_FIREFOX_WINDOWS =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0';
      const UA_SAFARI_IPHONE =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1';

      it('deviceName should be null when no User-Agent is sent', async () => {
        const { accessToken } =
          await userAccountsTestManager.createUserAndLogin();

        const sessions = await userAccountsTestManager.getSessions(accessToken);

        expect(sessions[0].deviceName).toBeNull();
      });

      it('deviceName should be parsed from Chrome on macOS User-Agent', async () => {
        const credentials = userAccountsTestManager.buildCreateUserDto();
        await userAccountsTestManager.createUser(credentials);

        const { body } = await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          undefined,
          UA_CHROME_MACOS,
        );

        const sessions = await userAccountsTestManager.getSessions(
          body.accessToken,
        );

        expect(sessions[0].deviceName).toBe('Chrome on macOS');
      });

      it('deviceName should be parsed from Firefox on Windows User-Agent', async () => {
        const credentials = userAccountsTestManager.buildCreateUserDto();
        await userAccountsTestManager.createUser(credentials);

        const { body } = await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          undefined,
          UA_FIREFOX_WINDOWS,
        );

        const sessions = await userAccountsTestManager.getSessions(
          body.accessToken,
        );

        expect(sessions[0].deviceName).toBe('Firefox on Windows');
      });

      it('deviceName should be parsed from Safari on iPhone User-Agent', async () => {
        const credentials = userAccountsTestManager.buildCreateUserDto();
        await userAccountsTestManager.createUser(credentials);

        const { body } = await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          undefined,
          UA_SAFARI_IPHONE,
        );

        const sessions = await userAccountsTestManager.getSessions(
          body.accessToken,
        );

        expect(sessions[0].deviceName).toBe('Safari on iPhone');
      });

      it('sessions from multiple devices should each carry their own deviceName', async () => {
        const credentials = userAccountsTestManager.buildCreateUserDto();
        await userAccountsTestManager.createUser(credentials);

        await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          'device-ua-1111-0000-0000-000000000001',
          UA_CHROME_MACOS,
        );
        await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          'device-ua-2222-0000-0000-000000000002',
          UA_FIREFOX_WINDOWS,
        );
        const { body } = await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          'device-ua-3333-0000-0000-000000000003',
          UA_SAFARI_IPHONE,
        );

        const sessions = await userAccountsTestManager.getSessions(
          body.accessToken,
        );

        expect(sessions).toHaveLength(3);
        const deviceNames: (string | null)[] = sessions
          .map((s: any) => s.deviceName)
          .sort();
        expect(deviceNames).toEqual(
          ['Chrome on macOS', 'Firefox on Windows', 'Safari on iPhone'].sort(),
        );
      });

      it('re-login from same device with a different User-Agent should update deviceName', async () => {
        const credentials = userAccountsTestManager.buildCreateUserDto();
        await userAccountsTestManager.createUser(credentials);
        const deviceId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

        await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          deviceId,
          UA_CHROME_MACOS,
        );
        const { body } = await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          deviceId,
          UA_FIREFOX_WINDOWS,
        );

        const sessions = await userAccountsTestManager.getSessions(
          body.accessToken,
        );

        expect(sessions).toHaveLength(1);
        expect(sessions[0].deviceName).toBe('Firefox on Windows');
      });

      it('isCurrent should point to the calling device session', async () => {
        const credentials = userAccountsTestManager.buildCreateUserDto();
        await userAccountsTestManager.createUser(credentials);

        const { body: body1 } = await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          'device-cur-1111-0000-0000-000000000001',
          UA_CHROME_MACOS,
        );
        const { body: body2 } = await userAccountsTestManager.login(
          credentials,
          HttpStatus.OK,
          'device-cur-2222-0000-0000-000000000002',
          UA_FIREFOX_WINDOWS,
        );

        const sessionsFromDevice1 = await userAccountsTestManager.getSessions(
          body1.accessToken,
        );
        const sessionsFromDevice2 = await userAccountsTestManager.getSessions(
          body2.accessToken,
        );

        const currentForDevice1 = sessionsFromDevice1.find(
          (s: any) => s.isCurrent,
        );
        const currentForDevice2 = sessionsFromDevice2.find(
          (s: any) => s.isCurrent,
        );

        expect(currentForDevice1).toBeDefined();
        expect(currentForDevice2).toBeDefined();
        expect(currentForDevice1.id).not.toBe(currentForDevice2.id);
        expect(currentForDevice1.deviceName).toBe('Chrome on macOS');
        expect(currentForDevice2.deviceName).toBe('Firefox on Windows');
      });
    });
  });
});
