import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserProfilesRepository } from '../../infra/user-profiles.repository';
import { ProfileImageService } from '../profile-image.service';
import { DomainException } from '../../../../core/exceptions/domain-exceptions';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { ProfileViewDto } from '../../api/view-dto/profile.view-dto';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import { ImageService } from '../../../../adapters/image/image.service';

const DAILY_UPLOAD_LIMIT = 5;

export class UploadProfileImageCommand {
  constructor(
    public readonly userId: number,
    public readonly file: Buffer,
    public readonly contentType: string,
  ) {}
}

@CommandHandler(UploadProfileImageCommand)
export class UploadProfileImageUseCase implements ICommandHandler<
  UploadProfileImageCommand,
  ProfileViewDto
> {
  constructor(
    private readonly userProfilesRepository: UserProfilesRepository,
    private readonly profileImageService: ProfileImageService,
    private readonly imageService: ImageService,
  ) {}

  async execute({
    userId,
    file,
    contentType,
  }: UploadProfileImageCommand): Promise<ProfileViewDto> {
    const profile = await this.userProfilesRepository.findByUserId(userId);
    if (!profile) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'profile not found',
      });
    }

    this.checkDailyUploadLimit(profile);

    const previousImageUrl = profile.profileImg;
    const compressed = await this.imageService.compress(file);
    const url = await this.profileImageService.upload(compressed.buffer, compressed.contentType);
    const isNewDay = this.isNewDate(profile.imageUploadResetDate);

    await this.userProfilesRepository.update(userId, {
      profileImg: url,
      dailyImageUploadCount: isNewDay ? 1 : profile.dailyImageUploadCount + 1,
      imageUploadResetDate: new Date(new Date().toISOString().slice(0, 10)),
    });

    await this.deletePreviousImage(previousImageUrl);

    const updated = await this.userProfilesRepository.findByUserId(userId);
    return ProfileViewDto.mapToViewDto(updated!);
  }

  private async deletePreviousImage(imageUrl: string | null): Promise<void> {
    if (!imageUrl) return;
    await this.profileImageService.delete(imageUrl);
  }

  private checkDailyUploadLimit(profile: UserProfile): void {
    const isNewDay = this.isNewDate(profile.imageUploadResetDate);
    const currentCount = isNewDay ? 0 : profile.dailyImageUploadCount;

    if (currentCount >= DAILY_UPLOAD_LIMIT) {
      throw new DomainException({
        code: DomainExceptionCode.TooManyRequests,
        message: `Profile image upload limit of ${DAILY_UPLOAD_LIMIT} per day reached`,
      });
    }
  }

  private isNewDate(resetDate: Date | null): boolean {
    const todayUtc = new Date().toISOString().slice(0, 10);
    const storedDate = resetDate
      ? new Date(resetDate).toISOString().slice(0, 10)
      : null;
    return storedDate !== todayUtc;
  }
}
