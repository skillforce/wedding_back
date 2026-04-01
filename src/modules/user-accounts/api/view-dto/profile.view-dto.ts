import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from '../../domain/entities/user-profile.entity';

export class ProfileViewDto {
  @ApiProperty({ nullable: true })
  invitationUrl: string | null;

  @ApiProperty({ nullable: true })
  profileImg: string | null;

  @ApiProperty({ nullable: true })
  weddingDate: Date | null;

  @ApiProperty({ nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ nullable: true })
  email: string | null;

  static mapToViewDto(profile: UserProfile): ProfileViewDto {
    const dto = new ProfileViewDto();
    dto.invitationUrl = profile.invitationUrl;
    dto.profileImg = profile.profileImg;
    dto.weddingDate = profile.weddingDate;
    dto.phoneNumber = profile.phoneNumber;
    dto.email = profile.email;
    return dto;
  }
}