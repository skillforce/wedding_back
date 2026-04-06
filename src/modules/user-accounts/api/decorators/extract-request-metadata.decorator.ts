import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { randomUUID } from 'crypto';

export interface RequestMetadata {
  userAgent: string;
  deviceId: string;
  isDeviceIdGenerated: boolean;
}

export const ExtractRequestMetadata = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): RequestMetadata => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const existingDeviceId = request.headers['x-device-id'] as string | undefined;
    const deviceId = existingDeviceId ?? randomUUID();

    return {
      userAgent: (request.headers['user-agent'] ?? 'Unknown').substring(0, 512),
      deviceId,
      isDeviceIdGenerated: !existingDeviceId,
    };
  },
);