import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { appConfig, gcpConfig, geminiConfig, supabaseConfig, validate } from './config';
import { DatabaseModule } from './database/database.module';
import { InventoryModule } from './inventory/inventory.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OcrModule } from './ocr/ocr.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProcurementModule } from './procurement/procurement.module';
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
    AuthModule,
    UsersModule,
    OrganizationsModule,
    StoresModule,
    InventoryModule,
    StockCountModule,
    ProcurementModule,
    SuppliersModule,
    OcrModule,
    NotificationsModule,
    AuditModule,
  ],
})
export class AppModule {}
