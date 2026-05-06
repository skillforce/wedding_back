import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { IsFieldExistAndStringWithTrim } from '../../../../core/decorators/validation/is-field-exist-and-string-with-trim';

export const firstPasswordConstraints = {
  minLength: 10,
  maxLength: 30,
};

export class ConfirmEmailInputDto {
  @ApiProperty({ description: 'Email confirmation token', example: 'a3f1c2d4-...' })
  @IsUUID()
  token: string;

  @ApiProperty({
    description: 'Initial password set by the user',
    minLength: firstPasswordConstraints.minLength,
    maxLength: firstPasswordConstraints.maxLength,
    example: 'mypassword1',
  })
  @IsFieldExistAndStringWithTrim(
    'password',
    firstPasswordConstraints.minLength,
    firstPasswordConstraints.maxLength,
  )
  password: string;
}