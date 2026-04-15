import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional } from 'class-validator';
import { IsFieldExistAndStringWithTrim } from '../../../../core/decorators/validation/is-field-exist-and-string-with-trim';
import {
  loginConstraints,
  passwordConstraints,
} from '../../domain/entities/user.entity';
import { Locale } from '../../../email/templates/confirmation-email.template';

export class CreatePlainUserInputDto {
  @ApiProperty({
    description: 'User login',
    minLength: loginConstraints.minLength,
    maxLength: loginConstraints.maxLength,
    example: 'johndoe',
  })
  @IsFieldExistAndStringWithTrim(
    'login',
    loginConstraints.minLength,
    loginConstraints.maxLength,
  )
  login: string;

  @ApiProperty({
    description: 'User password',
    minLength: passwordConstraints.minLength,
    maxLength: passwordConstraints.maxLength,
    example: 'secret123',
  })
  @IsFieldExistAndStringWithTrim(
    'password',
    passwordConstraints.minLength,
    passwordConstraints.maxLength,
  )
  password: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Email locale for confirmation email', enum: ['en', 'ru'], default: 'en' })
  @IsOptional()
  @IsIn(['en', 'ru'])
  locale?: Locale;
}