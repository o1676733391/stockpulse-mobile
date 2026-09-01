import { Injectable, Logger } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async findById(id: string): Promise<UserResponseDto | null> {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string): Promise<UserResponseDto | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findAll(): Promise<UserResponseDto[]> {
    return this.usersRepository.findAll();
  }

  async findByOrganization(organizationId: string): Promise<UserResponseDto[]> {
    return this.usersRepository.findByOrganization(organizationId);
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersRepository.create(dto);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.usersRepository.update(id, dto);
  }

  async delete(id: string): Promise<boolean> {
    return this.usersRepository.delete(id);
  }
}
