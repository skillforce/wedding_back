import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { IsFieldExistAndStringWithTrim } from '../../../../core/decorators/validation/is-field-exist-and-string-with-trim';
import {
  loginConstraints,
  passwordConstraints,
} from '../../domain/entities/user.entity';

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
}