import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../database/supabase.service';
import { RegisterDeviceTokenDto, SendNotificationDto } from './dto/notification.dto';
import { NotificationsRepository } from './notifications.repository';

describe('NotificationsRepository', () => {
  let repository: NotificationsRepository;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockSupabaseClient = {
    from: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsRepository,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    repository = module.get<NotificationsRepository>(NotificationsRepository);
    supabaseService = module.get(SupabaseService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createNotification', () => {
    it('should insert notification into Supabase', async () => {
      const insertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: {
            id: 'notif-01',
            store_id: 'store-01',
            user_id: 'user-01',
            notification_number: 'NOTIF-01',
            event_type: 'LOW_STOCK',
            title: 'Low Stock',
            message: 'Message',
            urgency: 'CRITICAL',
            is_read: false,
          },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(insertChain as any);

      const dto: SendNotificationDto = {
        userId: 'user-01',
        eventType: 'LOW_STOCK',
        title: 'Low Stock',
        message: 'Message',
        urgency: 'CRITICAL',
      };

      const result = await repository.createNotification(dto, 'store-01');

      expect(result.id).toBe('notif-01');
      expect(result.urgency).toBe('CRITICAL');
    });
  });

  describe('registerDeviceToken', () => {
    it('should upsert device token', async () => {
      const upsertChain = {
        upsert: jest.fn().mockResolvedValueOnce({ error: null }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(upsertChain as any);

      const dto: RegisterDeviceTokenDto = {
        expoPushToken: 'ExponentPushToken[123]',
        platform: 'ios',
      };

      await repository.registerDeviceToken(dto, 'store-01', 'user-01');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('device_tokens');
    });
  });
});
