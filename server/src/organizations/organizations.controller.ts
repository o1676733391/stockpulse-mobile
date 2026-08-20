import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateOrganizationDto,
  OrganizationResponseDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get(':id')
  @Roles('superadmin', 'manager')
  @ApiOperation({ summary: 'Get organization details and subscription status' })
  async findById(
    @Param('id') id: string,
  ): Promise<OrganizationResponseDto | null> {
    return this.organizationsService.findById(id);
  }

  @Post()
  @Roles('superadmin')
  @ApiOperation({ summary: 'Create new organization tenant' })
  async create(
    @Body() dto: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.create(dto);
  }

  @Patch(':id')
  @Roles('superadmin')
  @ApiOperation({ summary: 'Update organization details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsService.update(id, dto);
  }
}
