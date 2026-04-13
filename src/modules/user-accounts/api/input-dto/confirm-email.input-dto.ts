import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ConfirmEmailInputDto {
  @ApiProperty({ description: 'Email confirmation token', example: 'a3f1c2d4-...' })
  @IsUUID()
  token: string;
}