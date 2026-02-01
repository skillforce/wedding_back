import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class IdNumberParamDto {
  @Type(() => Number)
  @IsNumber()
  id: number;
}
