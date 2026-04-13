import { IsEmail, IsNumber, IsString } from 'class-validator';

export class CreateActivatedPlainUserInputDto {
  @IsString()
  login: string;

  @IsString()
  password: string;

  @IsEmail()
  email: string;

  @IsNumber()
  creatorUserId: number;
}