import { applyDecorators } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { Trim } from '../transform/trim';

export const IsFieldExistAndStringWithTrim = (
  fieldName: string,
  minLength?: number,
  maxLength?: number,
) => applyDecorators(IsString(), Length(minLength ?? 0, maxLength), Trim());
