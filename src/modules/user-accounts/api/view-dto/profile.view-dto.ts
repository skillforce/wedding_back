import { ApiProperty } from '@nestjs/swagger';
import { UserProfile } from '../../domain/entities/user-profile.entity';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/entities/user-role.enum';
import { UserStatus } from '../../domain/entities/user-status.enum';

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

  @ApiProperty()
  isSuperUser: boolean;

  @ApiProperty()
  isCreatedBySuperUser: boolean;

  @ApiProperty({ description: 'Whether the user has confirmed their email' })
  isConfirmed: boolean;

  static mapToViewDto(profile: UserProfile, user: User): ProfileViewDto {
    const dto = new ProfileViewDto();
    dto.invitationUrl = profile.invitationUrl;
    dto.profileImg = profile.profileImg;
    dto.weddingDate = profile.weddingDate;
    dto.phoneNumber = profile.phoneNumber;
    dto.email = profile.email;
    dto.isSuperUser = user.role === UserRole.SUPER_USER;
    dto.isCreatedBySuperUser = user.createdByUserId !== null;
    dto.isConfirmed = user.status === UserStatus.ACTIVE;
    return dto;
  }
}