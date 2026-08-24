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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentStore } from '../common/decorators/current-store.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateSupplierDto,
  SupplierResponseDto,
  UpdateSupplierDto,
} from './dto/supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('Suppliers')
@ApiBearerAuth('BearerAuth')
@ApiHeader({
  name: 'X-Store-Id',
  description: 'Active store tenant UUID context',
  required: true,
})
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @Roles('superadmin', 'manager', 'supervisor', 'staff', 'auditor')
  @RequirePermissions('procurement:view')
  @ApiOperation({ summary: 'List contracted suppliers for store' })
  @ApiResponse({
    status: 200,
    description: 'List of active contracted suppliers',
    type: [SupplierResponseDto],
  })
  async findAll(
    @CurrentStore() storeId: string,
  ): Promise<SupplierResponseDto[]> {
    return this.suppliersService.findAll(storeId);
  }

  @Get(':id')
  @Roles('superadmin', 'manager', 'supervisor', 'staff', 'auditor')
  @RequirePermissions('procurement:view')
  @ApiOperation({ summary: 'Get supplier details by ID' })
  @ApiParam({ name: 'id', description: 'Supplier UUID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier details',
    type: SupplierResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async findById(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ): Promise<SupplierResponseDto | null> {
    return this.suppliersService.findById(id, storeId);
  }

  @Post()
  @Roles('superadmin', 'manager')
  @RequirePermissions('procurement:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new vendor / supplier' })
  @ApiResponse({
    status: 201,
    description: 'Supplier registered successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Body() dto: CreateSupplierDto,
    @CurrentStore() storeId: string,
  ): Promise<SupplierResponseDto> {
    return this.suppliersService.create(dto, storeId);
  }

  @Patch(':id')
  @Roles('superadmin', 'manager')
  @RequirePermissions('procurement:create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update supplier details' })
  @ApiParam({ name: 'id', description: 'Supplier UUID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier updated successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentStore() storeId: string,
  ): Promise<SupplierResponseDto> {
    return this.suppliersService.update(id, dto, storeId);
  }

  @Delete(':id')
  @Roles('superadmin', 'manager')
  @RequirePermissions('procurement:create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete / archive supplier' })
  @ApiParam({ name: 'id', description: 'Supplier UUID' })
  @ApiResponse({
    status: 200,
    description: 'Supplier archived',
  })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async delete(
    @Param('id') id: string,
    @CurrentStore() storeId: string,
  ): Promise<{ success: boolean }> {
    const success = await this.suppliersService.delete(id, storeId);
    return { success };
  }
}
