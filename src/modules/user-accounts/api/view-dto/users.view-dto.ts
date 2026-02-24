import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../domain/entities/user.entity';

export class UsersViewDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'User login', example: 'admin' })
  login: string;

  static mapToViewDto(user: User): UsersViewDto {
    const dto = new UsersViewDto();

    dto.id = user.id;
    dto.login = user.login;

    return dto;
  }
}