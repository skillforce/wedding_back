import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../domain/entities/user.entity';
import { ProfileViewDto } from './profile.view-dto';

export class MeViewDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'User login', example: 'admin' })
  login: string;

  @ApiProperty({ type: ProfileViewDto, nullable: true })
  profile: ProfileViewDto | null;

  static mapToViewDto(user: User): MeViewDto {
    const dto = new MeViewDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.profile = user.profile ? ProfileViewDto.mapToViewDto(user.profile) : null;
    return dto;
  }
}