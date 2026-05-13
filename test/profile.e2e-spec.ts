import { HttpStatus, INestApplication } from '@nestjs/common';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../src/modules/user-accounts/constants/auth-token.inject-context';
import { initTesting } from './helpers/initTesting';
import { UserAccountsConfig } from '../src/modules/user-accounts/config/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { deleteAllData } from './helpers/delete-all-data';
import { UserAccountsTestManager } from './helpers/user-acounts.test-manager';
import { ProfileTestManager } from './helpers/profile.test-manager';
import { getOptionsToken } from '@nestjs/throttler';
import { ProfileImageService } from '../src/modules/user-accounts/application/profile-image.service';
import { FAKE_JPEG_BUFFER } from './helpers/profile.test-manager';
import { ImageService } from '../src/adapters/image/image.service';
import { UserRole } from '../src/modules/user-accounts/domain/entities/user-role.enum';

const FAKE_IMAGE_URL = 'https://s3.example.com/profiles/avatars/1';

describe('Profile (e2e)', () => {
  let app: INestApplication;
  let userAccountsTestManager: UserAccountsTestManager;
  let profileTestManager: ProfileTestManager;

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
        .overrideProvider(ProfileImageService)
        .useValue({
          upload: jest.fn().mockResolvedValue(FAKE_IMAGE_URL),
          delete: jest.fn().mockResolvedValue(undefined),
        })
        .overrideProvider(ImageService)
        .useValue({
          compress: jest.fn().mockResolvedValue({
            buffer: FAKE_JPEG_BUFFER,
            contentType: 'image/avif',
          }),
        }),
    );
    app = result.app;
    userAccountsTestManager = result.userAccountsTestManager;
    profileTestManager = result.profileTestManager;
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const defaultProfile = {
    invitationUrl: null,
    profileImg: null,
    weddingDate: null,
    isCreatedBySuperUser: false,
    isSuperUser: false,
    isConfirmed: true,
    email: null,
  };

  it('should auto-create a default profile (all nulls) when a user is created', async () => {
    const { accessToken } = await userAccountsTestManager.createUserAndLogin();

    const me = await userAccountsTestManager.me(accessToken);

    expect(me.profile).toEqual(defaultProfile);
  });

  it('should update only provided profile fields (partial patch)', async () => {
    const { accessToken } = await userAccountsTestManager.createUserAndLogin();

    const updated = await profileTestManager.updateProfile(accessToken, {
      invitationUrl: 'https://example.com/invite/abc',
    });

    expect(updated).toEqual({
      ...defaultProfile,
      invitationUrl: 'https://example.com/invite/abc',
    });
  });

  it('should update weddingDate field', async () => {
    const { accessToken } = await userAccountsTestManager.createUserAndLogin();

    const updated = await profileTestManager.updateProfile(accessToken, {
      weddingDate: '2025-06-15',
    });

    expect(updated.weddingDate).not.toBeNull();
    expect(new Date(updated.weddingDate).toISOString()).toContain('2025-06-15');
  });

  it('should not overwrite untouched fields on repeated patches', async () => {
    const { accessToken } = await userAccountsTestManager.createUserAndLogin();

    await profileTestManager.updateProfile(accessToken, {
      invitationUrl: 'https://example.com/invite/abc',
    });

    const updated = await profileTestManager.updateProfile(accessToken, {
      email: 'user@example.com',
    });

    expect(updated).toEqual({
      ...defaultProfile,
      invitationUrl: 'https://example.com/invite/abc',
      email: 'user@example.com',
    });
  });

  it('should reject PATCH /users/profile without auth', async () => {
    await profileTestManager.updateProfile(
      'invalid-token',
      { invitationUrl: 'https://example.com' },
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('should reflect updated profile in GET /auth/me', async () => {
    const { accessToken, userId } =
      await userAccountsTestManager.createUserAndLogin();

    await profileTestManager.updateProfile(accessToken, {
      email: 'user@example.com',
    });

    const me = await userAccountsTestManager.me(accessToken);

    expect(me).toEqual(
      expect.objectContaining({
        id: userId,
        profile: expect.objectContaining({ email: 'user@example.com' }),
      }),
    );
  });

  describe('plain user created by super user', () => {
    let plainUserAccessToken: string;
    let plainUserEmail: string;

    beforeEach(async () => {
      const superUserDto = userAccountsTestManager.buildCreateUserDto({
        role: UserRole.SUPER_USER,
      });
      const superUser = await userAccountsTestManager.createUser(superUserDto);
      await userAccountsTestManager.login(superUserDto);

      const plainUserDto = userAccountsTestManager.buildCreatePlainUserDto();
      await userAccountsTestManager.createActivatedPlainUser(
        superUser.id,
        plainUserDto,
      );

      const { body: plainUserBody } = await userAccountsTestManager.login(plainUserDto);
      plainUserAccessToken = plainUserBody.accessToken;
      plainUserEmail = plainUserDto.email;
    });

    it('should have isCreatedBySuperUser=true and isSuperUser=false in default profile', async () => {
      const me = await userAccountsTestManager.me(plainUserAccessToken);

      expect(me.profile).toEqual({
        ...defaultProfile,
        email: plainUserEmail,
        isCreatedBySuperUser: true,
        isSuperUser: false,
      });
    });

    it('should preserve isCreatedBySuperUser=true after profile update', async () => {
      const updated = await profileTestManager.updateProfile(
        plainUserAccessToken,
        {
          invitationUrl: 'https://example.com/invite/abc',
        },
      );

      expect(updated.isCreatedBySuperUser).toBe(true);
      expect(updated.isSuperUser).toBe(false);
    });
  });

  describe('PATCH /users/profile/image', () => {
    it('should upload profile image and store the URL', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const updated = await profileTestManager.uploadProfileImage(
        accessToken,
        FAKE_JPEG_BUFFER,
        'image/png',
      );

      expect(updated.profileImg).toBe(FAKE_IMAGE_URL);
    });

    it('should reject upload without auth', async () => {
      await profileTestManager.uploadProfileImage(
        'invalid-token',
        FAKE_JPEG_BUFFER,
        'image/png',
        HttpStatus.UNAUTHORIZED,
      );
    });

    it('should reject file exceeding 15 MB', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      const oversizedFile = Buffer.concat([
        FAKE_JPEG_BUFFER,
        Buffer.alloc(16 * 1024 * 1024),
      ]);
      await profileTestManager.uploadProfileImage(
        accessToken,
        oversizedFile,
        'image/png',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    });

    it('should reject non-image file type', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();

      await profileTestManager.uploadProfileImage(
        accessToken,
        Buffer.from('fake-pdf-data'),
        'application/pdf',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    });

    it('should allow up to 5 uploads per day', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const fakeImage = Buffer.from('fake-image-data');

      for (let i = 0; i < 5; i++) {
        await profileTestManager.uploadProfileImage(
          accessToken,
          fakeImage,
          'image/png',
          HttpStatus.OK,
        );
      }
    });

    it('should reject the 6th upload on the same day', async () => {
      const { accessToken } =
        await userAccountsTestManager.createUserAndLogin();
      const fakeImage = Buffer.from('fake-image-data');

      for (let i = 0; i < 5; i++) {
        await profileTestManager.uploadProfileImage(
          accessToken,
          fakeImage,
          'image/png',
        );
      }

      await profileTestManager.uploadProfileImage(
        accessToken,
        fakeImage,
        'image/png',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    });
  });
});
