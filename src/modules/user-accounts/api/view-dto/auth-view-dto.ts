import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../domain/entities/user.entity';

export class MeViewDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'User login', example: 'admin' })
  login: string;

  @ApiProperty({ description: 'Invitation URL', example: 'https://example.com/invite/abc123', nullable: true })
  invitationUrl: string | null;

  static mapToViewDto(user: User): MeViewDto {
    const dto = new MeViewDto();

    dto.id = user.id;
    dto.login = user.login;
    dto.invitationUrl = user.invitationUrl;

    return dto;
  }
}