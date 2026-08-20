import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { NotificationUrgency } from '../entities/notification.entity';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    description: 'Expo Push Notification Device Token',
  })
  @IsString()
  @IsNotEmpty({ message: 'Expo push token is required' })
  expoPushToken!: string;

  @ApiProperty({ example: 'ios', enum: ['ios', 'android', 'web'], description: 'Client mobile platform' })
  @IsEnum(['ios', 'android', 'web'], { message: 'Platform must be ios, android, or web' })
  platform!: 'ios' | 'android' | 'web';

  @ApiPropertyOptional({ example: '1.2.0', description: 'Installed application version' })
  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ example: true, description: 'Enable in-app notifications' })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Enable mobile push notifications' })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Enable email digest notifications' })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Receive alerts when stock is critically low' })
  @IsOptional()
  @IsBoolean()
  lowStockAlerts?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Receive warnings before FEFO batch expiry' })
  @IsOptional()
  @IsBoolean()
  expiringBatches?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Receive purchase order lifecycle updates' })
  @IsOptional()
  @IsBoolean()
  poStatusUpdates?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Receive scheduled stock count alarms' })
  @IsOptional()
  @IsBoolean()
  stockCountReminders?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Receive notice when Document AI OCR scan completes' })
  @IsOptional()
  @IsBoolean()
  ocrScanCompleted?: boolean;

  @ApiPropertyOptional({ example: '22:00', description: 'Quiet window start (HH:MM 24-hour)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Quiet hours start must be in HH:MM 24-hour format',
  })
  quietHoursStart?: string;

  @ApiPropertyOptional({ example: '07:00', description: 'Quiet window end (HH:MM 24-hour)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Quiet hours end must be in HH:MM 24-hour format',
  })
  quietHoursEnd?: string;
}

export class NotificationPreferencesResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  userId!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiProperty({ example: true })
  inAppEnabled!: boolean;

  @ApiProperty({ example: true })
  pushEnabled!: boolean;

  @ApiProperty({ example: false })
  emailEnabled!: boolean;

  @ApiProperty({ example: true })
  lowStockAlerts!: boolean;

  @ApiProperty({ example: true })
  expiringBatches!: boolean;

  @ApiProperty({ example: true })
  poStatusUpdates!: boolean;

  @ApiProperty({ example: true })
  stockCountReminders!: boolean;

  @ApiProperty({ example: true })
  ocrScanCompleted!: boolean;

  @ApiPropertyOptional({ example: '22:00' })
  quietHoursStart?: string;

  @ApiPropertyOptional({ example: '07:00' })
  quietHoursEnd?: string;

  @ApiProperty({ example: '2026-08-20T08:00:00.000Z' })
  updatedAt!: string;
}

export class QueryNotificationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: false, description: 'Filter unread (false) or read (true)' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ example: 'CRITICAL', enum: ['NORMAL', 'CRITICAL'] })
  @IsOptional()
  @IsEnum(['NORMAL', 'CRITICAL'])
  urgency?: NotificationUrgency;

  @ApiPropertyOptional({ example: 'LOW_STOCK', description: 'Filter by event type identifier' })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class SendNotificationDto {
  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e001', description: 'Target user UUID (omitted for store-wide broadcasts)' })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @ApiProperty({ example: 'LOW_STOCK' })
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @ApiProperty({ example: 'Critical Low Stock: Whole Milk' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Whole Milk 3.5% (8L) is below safety stock threshold (15L).' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ example: 'CRITICAL', enum: ['NORMAL', 'CRITICAL'], default: 'NORMAL' })
  @IsOptional()
  @IsEnum(['NORMAL', 'CRITICAL'])
  urgency?: NotificationUrgency = 'NORMAL';

  @ApiPropertyOptional({ example: '/inventory/01915dfa-b1c4-7221-9988-51b72e04e0a1', description: 'In-app deep link route' })
  @IsOptional()
  @IsString()
  route?: string;

  @ApiPropertyOptional({ example: { itemId: '01915dfa-b1c4-7221-9988-51b72e04e0a1', sku: 'DAI-001' } })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class NotificationResponseDto {
  @ApiProperty({ example: '01915dfa-b1c4-7221-9988-51b72e04e099' })
  id!: string;

  @ApiProperty({ example: '01915dfa-9012-7000-8000-000000000002' })
  storeId!: string;

  @ApiPropertyOptional({ example: '01915dfa-b1c4-7221-9988-51b72e04e001' })
  userId?: string;

  @ApiProperty({ example: 'NOTIF-20260820-0001' })
  notificationNumber!: string;

  @ApiProperty({ example: 'LOW_STOCK' })
  eventType!: string;

  @ApiProperty({ example: 'Critical Low Stock: Whole Milk' })
  title!: string;

  @ApiProperty({ example: 'Whole Milk 3.5% (8L) is below safety threshold (15L).' })
  message!: string;

  @ApiProperty({ example: 'CRITICAL', enum: ['NORMAL', 'CRITICAL'] })
  urgency!: NotificationUrgency;

  @ApiPropertyOptional({ example: '/inventory/01915dfa-b1c4-7221-9988-51b72e04e0a1' })
  route?: string;

  @ApiPropertyOptional({ example: { sku: 'DAI-001' } })
  metadata?: Record<string, unknown>;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiPropertyOptional({ example: '2026-08-20T08:15:00.000Z' })
  readAt?: string;

  @ApiProperty({ example: '2026-08-20T08:00:00.000Z' })
  createdAt!: string;
}

export class UnreadCountResponseDto {
  @ApiProperty({ example: 3, description: 'Total unread notifications' })
  unreadCount!: number;

  @ApiProperty({ example: 1, description: 'Critical unread notifications count' })
  criticalCount!: number;
}

export class BatchMarkReadResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 3, description: 'Number of notifications marked as read' })
  markedReadCount!: number;
}
