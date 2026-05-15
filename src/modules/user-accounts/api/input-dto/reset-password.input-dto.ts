import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { IsFieldExistAndStringWithTrim } from '../../../../core/decorators/validation/is-field-exist-and-string-with-trim';
import { firstPasswordConstraints } from './confirm-email.input-dto';

export class ResetPasswordInputDto {
  @ApiProperty({ description: 'Password reset token', example: 'a3f1c2d4-...' })
  @IsUUID()
  token: string;

  @ApiProperty({
    description: 'New password',
    minLength: firstPasswordConstraints.minLength,
    maxLength: firstPasswordConstraints.maxLength,
    example: 'mynewpassword1',
  })
  @IsFieldExistAndStringWithTrim(
    'password',
    firstPasswordConstraints.minLength,
    firstPasswordConstraints.maxLength,
  )
  password: string;
}