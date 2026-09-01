import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private adminClient!: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl =
      this.configService.get<string>('supabase.url') ||
      process.env.SUPABASE_URL ||
      '';
    const serviceRoleKey =
      this.configService.get<string>('supabase.serviceRoleKey') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      '';

    if (!supabaseUrl || !serviceRoleKey) {
      this.logger.warn('Supabase credentials missing. Client running in uninitialized/mock mode.');
      return;
    }

    this.adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('Supabase Admin Client successfully initialized.');
  }

  /**
   * Get administrative Supabase client (Bypasses RLS using service_role key).
   */
  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  /**
   * Get user-scoped Supabase client with JWT context (Enforces RLS).
   */
  getUserClient(accessToken: string): SupabaseClient {
    const supabaseUrl = this.configService.get<string>('supabase.url') || '';
    const anonKey = this.configService.get<string>('supabase.anonKey') || '';

    return createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
}
