import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get profile of authenticated user' })
  async getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    if (user?.id) {
      const fromId = await this.usersService.findById(user.id);
      if (fromId) return fromId;
    }
    if (user?.email) {
      const fromEmail = await this.usersService.findByEmail(user.email);
      if (fromEmail) return fromEmail;
    }

    return {
      id: user?.id || '01915dfa-b1c4-7221-9988-51b72e04e001',
      email: user?.email || '',
      name: user?.name || user?.email?.split('@')[0] || 'User',
      phone: (user as any)?.phone || undefined,
      role: user?.role || 'staff',
      organizationId: user?.organizationId || '01915dfa-9012-7000-8000-000000000001',
      assignedStoreIds: user?.assignedStoreIds || ['01915dfa-9012-7000-8000-000000000002'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile of authenticated user' })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    let targetId = user?.id;
    if (user?.email) {
      const existing = await this.usersService.findByEmail(user.email);
      if (existing?.id) {
        targetId = existing.id;
      }
    }

    if (targetId) {
      try {
        return await this.usersService.update(targetId, {
          name: dto.name,
          phone: dto.phone,
        });
      } catch (err) {
        if (user?.email) {
          return await this.usersService.create({
            email: user.email,
            name: dto.name || user.name || 'User',
            phone: dto.phone,
            role: user.role || 'staff',
            organizationId: user.organizationId || '01915dfa-9012-7000-8000-000000000001',
            assignedStoreIds: user.assignedStoreIds || ['01915dfa-9012-7000-8000-000000000002'],
          });
        }
        throw err;
      }
    }

    throw new BadRequestException('Cannot identify authenticated user');
  }

  @Get()
  @ApiOperation({ summary: 'Get all team members' })
  async findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'superadmin', 'manager')
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string): Promise<UserResponseDto | null> {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles('admin', 'superadmin', 'manager')
  @ApiOperation({ summary: 'Create a new team member' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'superadmin', 'manager')
  @ApiOperation({ summary: 'Update user profile and store assignments' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'superadmin', 'manager')
  @ApiOperation({ summary: 'Deactivate / Delete user' })
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.usersService.delete(id);
    return { success };
  }
}
