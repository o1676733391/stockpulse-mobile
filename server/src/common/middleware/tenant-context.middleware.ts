import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request & { storeId?: string }, _res: Response, next: NextFunction) {
    const rawStoreId = req.headers['x-store-id'];

    if (rawStoreId && typeof rawStoreId === 'string') {
      req.storeId = rawStoreId.trim();
    } else if (Array.isArray(rawStoreId) && rawStoreId[0]) {
      req.storeId = rawStoreId[0].trim();
    }

    next();
  }
}
