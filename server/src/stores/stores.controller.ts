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
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import {
  CreateStoreDto,
  StoreResponseDto,
  UpdateStoreDto,
} from './dto/store.dto';
import { StoresService } from './stores.service';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'Get all stores in active organization' })
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StoreResponseDto[]> {
    if (user?.organizationId) {
      return this.storesService.findByOrganization(user.organizationId);
    }
    return this.storesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store location details' })
  async findById(@Param('id') id: string): Promise<StoreResponseDto | null> {
    return this.storesService.findById(id);
  }

  @Post()
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Create new store location' })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateStoreDto,
  ): Promise<StoreResponseDto> {
    const payload = {
      ...dto,
      organizationId: dto.organizationId || orgId || '01915dfa-9012-7000-8000-000000000001',
    };
    return this.storesService.create(payload);
  }

  @Patch(':id')
  @Roles('admin', 'superadmin', 'manager')
  @ApiOperation({ summary: 'Update store location settings' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
  ): Promise<StoreResponseDto> {
    return this.storesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Deactivate / Delete store location' })
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.storesService.delete(id);
    return { success };
  }
}
