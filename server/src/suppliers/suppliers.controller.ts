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
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateSupplierDto,
  SupplierResponseDto,
  UpdateSupplierDto,
} from './dto/supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('Suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'List contracted suppliers for store' })
  async findAll(
    @CurrentStore() storeId: string,
  ): Promise<SupplierResponseDto[]> {
    return this.suppliersService.findAll(storeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier details' })
  async findById(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ): Promise<SupplierResponseDto | null> {
    return this.suppliersService.findById(id, storeId);
  }

  @Post()
  @Roles('superadmin', 'manager')
  @ApiOperation({ summary: 'Register new supplier' })
  async create(
    @Body() dto: CreateSupplierDto,
    @CurrentStore() storeId: string,
  ): Promise<SupplierResponseDto> {
    return this.suppliersService.create(dto, storeId);
  }

  @Patch(':id')
  @Roles('superadmin', 'manager')
  @ApiOperation({ summary: 'Update supplier details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentStore() storeId: string,
  ): Promise<SupplierResponseDto> {
    return this.suppliersService.update(id, dto, storeId);
  }

  @Delete(':id')
  @Roles('superadmin', 'manager')
  @ApiOperation({ summary: 'Soft-delete supplier' })
  async delete(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ): Promise<{ success: boolean }> {
    const success = await this.suppliersService.delete(id, storeId);
    return { success };
  }
}
