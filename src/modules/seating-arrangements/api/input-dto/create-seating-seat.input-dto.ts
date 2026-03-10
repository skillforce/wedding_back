import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSeatingSeatInputDto {
  @ApiProperty({ description: 'Guest UUID to assign to this seat', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsNotEmpty()
  @IsUUID()
  guest_id: string;
}
