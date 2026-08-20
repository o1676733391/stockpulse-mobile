import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { TenantStoreGuard } from './guards/tenant-store.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TenantIsolationInterceptor } from './interceptors/tenant-isolation.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';

@Global()
@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantStoreGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantIsolationInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    TenantContextMiddleware,
  ],
  exports: [TenantContextMiddleware],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
