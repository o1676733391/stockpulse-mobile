import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentStore = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.storeId || request.headers['x-store-id'];
  },
);
