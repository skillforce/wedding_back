import { ApiProperty } from '@nestjs/swagger';
import { IsFieldExistAndStringWithTrim } from '../../../../core/decorators/validation/is-field-exist-and-string-with-trim';

export class LoginInputDto {
  @ApiProperty({ description: 'User login or email', example: 'admin' })
  @IsFieldExistAndStringWithTrim('loginOrEmail')
  loginOrEmail: string;

  @ApiProperty({ description: 'User password', example: 'secret123' })
  @IsFieldExistAndStringWithTrim('password')
  password: string;
}