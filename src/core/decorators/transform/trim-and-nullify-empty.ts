import { Transform, TransformFnParams } from 'class-transformer';

export const TrimAndNullifyEmpty = () => {
  return Transform(({ value }: TransformFnParams) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length ? trimmedValue : null;
  });
};
