import { Injectable } from '@nestjs/common';
import {
  CreateOrganizationDto,
  OrganizationResponseDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';
import { OrganizationsRepository } from './organizations.repository';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
  ) {}

  async findById(id: string): Promise<OrganizationResponseDto | null> {
    return this.organizationsRepository.findById(id);
  }

  async create(dto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    return this.organizationsRepository.create(dto);
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizationsRepository.update(id, dto);
  }
}
