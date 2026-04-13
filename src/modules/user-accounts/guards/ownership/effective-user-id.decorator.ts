import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const EffectiveUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    return ctx.switchToHttp().getRequest().effectiveUserId;
  },
);