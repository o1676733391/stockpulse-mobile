import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { appConfig, gcpConfig, geminiConfig, supabaseConfig, validate } from './config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { InventoryModule } from './inventory/inventory.module';
import { InvitationsModule } from './invitations/invitations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OcrModule } from './ocr/ocr.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProcurementModule } from './procurement/procurement.module';
import { RecipesModule } from './recipes/recipes.module';
import { StockCountModule } from './stock-count/stock-count.module';
import { StoresModule } from './stores/stores.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, supabaseConfig, gcpConfig, geminiConfig],
      validate,
    }),
    DatabaseModule,
    CommonModule,
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    StoresModule,
    InvitationsModule,
    InventoryModule,
    RecipesModule,
    StockCountModule,
    ProcurementModule,
    SuppliersModule,
    OcrModule,
    NotificationsModule,
    AuditModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
