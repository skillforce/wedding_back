import { ApiProperty } from '@nestjs/swagger';
import { AuthSession } from '../../domain/entities/auth-session.entity';

export class SessionViewDto {
  @ApiProperty({ example: 'a3f1c2d4-1234-5678-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Chrome on macOS', nullable: true })
  deviceName: string | null;

  @ApiProperty()
  lastActiveAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ description: 'True if this is the session making the request' })
  isCurrent: boolean;

  static mapToView(session: AuthSession, currentSessionId: string): SessionViewDto {
    const dto = new SessionViewDto();
    dto.id = session.id;
    dto.deviceName = session.deviceName;
    dto.lastActiveAt = session.lastActiveAt;
    dto.createdAt = session.createdAt!;
    dto.isCurrent = session.id === currentSessionId;
    return dto;
  }
}