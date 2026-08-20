import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  BatchMarkReadResponseDto,
  NotificationPreferencesResponseDto,
  NotificationResponseDto,
  QueryNotificationsDto,
  RegisterDeviceTokenDto,
  SendNotificationDto,
  UnreadCountResponseDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('BearerAuth')
@ApiHeader({
  name: 'X-Store-Id',
  description: 'Active store tenant UUID context',
  required: true,
})
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List in-app notification history with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Paginated in-app notifications',
    type: PaginatedResponseDto,
  })
  async findNotifications(
    @Query() query: QueryNotificationsDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') userId: string,
  ): Promise<PaginatedResponseDto<NotificationResponseDto>> {
    return this.notificationsService.findNotifications(query, storeId, userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count badge' })
  @ApiResponse({
    status: 200,
    description: 'Unread badge counts',
    type: UnreadCountResponseDto,
  })
  async getUnreadCount(
    @CurrentStore() storeId: string,
    @CurrentUser('id') userId: string,
  ): Promise<UnreadCountResponseDto> {
    return this.notificationsService.getUnreadCount(storeId, userId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an in-app notification as read' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  async markAsRead(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
    @CurrentUser('id') userId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsRead(id, storeId, userId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all unread notifications in store as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    type: BatchMarkReadResponseDto,
  })
  async markAllAsRead(
    @CurrentStore() storeId: string,
    @CurrentUser('id') userId: string,
  ): Promise<BatchMarkReadResponseDto> {
    return this.notificationsService.markAllAsRead(storeId, userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get current user notification channel and event preferences' })
  @ApiResponse({
    status: 200,
    description: 'User notification preferences',
    type: NotificationPreferencesResponseDto,
  })
  async getPreferences(
    @CurrentUser('id') userId: string,
    @CurrentStore() storeId: string,
  ): Promise<NotificationPreferencesResponseDto> {
    return this.notificationsService.getPreferences(userId, storeId);
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user notification channel and category preferences' })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
    type: NotificationPreferencesResponseDto,
  })
  async updatePreferences(
    @CurrentUser('id') userId: string,
    @CurrentStore() storeId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesResponseDto> {
    return this.notificationsService.updatePreferences(userId, storeId, dto);
  }

  @Post('device-tokens')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register Expo device push token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device token registered' })
  async registerDeviceToken(
    @Body() dto: RegisterDeviceTokenDto,
    @CurrentStore() storeId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean }> {
    return this.notificationsService.registerDeviceToken(dto, storeId, userId);
  }

  @Delete('device-tokens/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unregister Expo push token on user logout' })
  @ApiParam({ name: 'token', description: 'Expo push token' })
  async unregisterDeviceToken(
    @Param('token') token: string,
    @CurrentStore() storeId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ success: boolean }> {
    return this.notificationsService.unregisterDeviceToken(token, storeId, userId);
  }

  @Post('send')
  @Roles('superadmin', 'manager')
  @RequirePermissions('notifications:send')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send system alert or custom store notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification created and dispatched',
    type: NotificationResponseDto,
  })
  async sendNotification(
    @Body() dto: SendNotificationDto,
    @CurrentStore() storeId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.sendNotification(dto, storeId);
  }
}
