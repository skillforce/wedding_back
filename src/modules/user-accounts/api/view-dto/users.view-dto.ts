import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../domain/entities/user.entity';
import { ProfileViewDto } from './profile.view-dto';

export class UsersViewDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'User login', example: 'admin' })
  login: string;

  @ApiProperty({ type: ProfileViewDto })
  profile: ProfileViewDto;

  static mapToViewDto(user: User): UsersViewDto {
    const dto = new UsersViewDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.profile = ProfileViewDto.mapToViewDto(user.profile!, user);
    return dto;
  }
}