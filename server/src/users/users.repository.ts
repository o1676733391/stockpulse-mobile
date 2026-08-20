import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { IUserRepository } from './interfaces/user.repository.interface';

@Injectable()
export class UsersRepository implements IUserRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findById(id: string): Promise<UserResponseDto | null> {
    this.logger.log(`UsersRepository.findById: ${id}`);
    return null;
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    this.logger.log(`UsersRepository.findByEmail: ${email}`);
    return null;
  }

  async findByOrganization(organizationId: string): Promise<UserResponseDto[]> {
    this.logger.log(`UsersRepository.findByOrganization: ${organizationId}`);
    return [];
  }

  async findAll(): Promise<UserResponseDto[]> {
    return [];
  }

  async create(data: CreateUserDto): Promise<UserResponseDto> {
    this.logger.log(`UsersRepository.create: ${data.email}`);
    return {
      id: '01915dfa-9012-7000-8000-000000000099',
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async update(id: string, data: UpdateUserDto): Promise<UserResponseDto> {
    this.logger.log(`UsersRepository.update: ${id}`);
    return {
      id,
      email: 'user@stockpulse.io',
      name: data.name || 'User',
      role: data.role || 'staff',
      organizationId: '01915dfa-9012-7000-8000-000000000001',
      assignedStoreIds: data.assignedStoreIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async delete(id: string): Promise<boolean> {
    this.logger.log(`UsersRepository.delete: ${id}`);
    return true;
  }
}
