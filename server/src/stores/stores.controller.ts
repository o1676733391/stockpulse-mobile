import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
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

  @Get(':id')
  @ApiOperation({ summary: 'Get store location details' })
  async findById(@Param('id') id: string): Promise<StoreResponseDto | null> {
    return this.storesService.findById(id);
  }

  @Post()
  @Roles('superadmin')
  @ApiOperation({ summary: 'Create new store location' })
  async create(@Body() dto: CreateStoreDto): Promise<StoreResponseDto> {
    return this.storesService.create(dto);
  }

  @Patch(':id')
  @Roles('superadmin', 'manager')
  @ApiOperation({ summary: 'Update store location settings' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
  ): Promise<StoreResponseDto> {
    return this.storesService.update(id, dto);
  }
}
