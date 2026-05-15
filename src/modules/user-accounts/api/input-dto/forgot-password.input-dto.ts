import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordInputDto {
  @ApiProperty({ description: 'Email address to send the reset link to', example: 'user@example.com' })
  @IsEmail()
  email: string;
}