import { FileValidator } from '@nestjs/common';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

export class ImageFileTypeValidator extends FileValidator {
  isValid(file?: Express.Multer.File): boolean {
    if (!file) return false;
    return ALLOWED_MIME_TYPES.includes(file.mimetype);
  }

  buildErrorMessage(): string {
    return `File must be an image (${ALLOWED_MIME_TYPES.join(', ')})`;
  }
}