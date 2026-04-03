import { HttpStatus, MaxFileSizeValidator, ParseFilePipe, UploadedFile } from '@nestjs/common';
import { ImageFileTypeValidator } from './image-file-type.validator';

export const ParseProfileImage = () =>
  UploadedFile(
    new ParseFilePipe({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      validators: [
        new MaxFileSizeValidator({ maxSize: 15 * 1024 * 1024 }),
        new ImageFileTypeValidator({}),
      ],
    }),
  );