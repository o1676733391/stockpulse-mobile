import {
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
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get profile of authenticated user' })
  async getMe(@CurrentUser('id') userId: string): Promise<UserResponseDto | null> {
    return this.usersService.findById(userId);
  }

  @Get(':id')
  @Roles('superadmin', 'manager')
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string): Promise<UserResponseDto | null> {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles('superadmin', 'manager')
  @ApiOperation({ summary: 'Create a new team member' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles('superadmin', 'manager')
  @ApiOperation({ summary: 'Update user profile and store assignments' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Deactivate / Delete user' })
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.usersService.delete(id);
    return { success };
  }
}
