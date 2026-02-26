import { Type } from 'class-transformer';
import { IsNumber, IsUUID } from 'class-validator';

export class IdNumberParamDto {
  @Type(() => Number)
  @IsNumber()
  id: number;
}

export class IdUuidParamDto {
  @IsUUID()
  id: string;
}
