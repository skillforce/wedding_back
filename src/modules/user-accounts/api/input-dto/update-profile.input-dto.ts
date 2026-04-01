import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UpdateProfileInputDto {
  @ApiPropertyOptional({ example: 'https://example.com/invite/abc123' })
  @IsOptional()
  @IsString()
  invitationUrl?: string;

  @ApiPropertyOptional({ example: '2025-06-15' })
  @IsOptional()
  @IsDateString()
  weddingDate?: string;

  @ApiPropertyOptional({ example: '+375291234567' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @Matches(EMAIL_REGEX, { message: 'email must be a valid email address' })
  email?: string;
}