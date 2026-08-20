import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import {
  CreateOrganizationDto,
  OrganizationResponseDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';
import { IOrganizationRepository } from './interfaces/organization.repository.interface';

@Injectable()
export class OrganizationsRepository implements IOrganizationRepository {
  private readonly logger = new Logger(OrganizationsRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findById(id: string): Promise<OrganizationResponseDto | null> {
    this.logger.log(`OrganizationsRepository.findById: ${id}`);
    return null;
  }

  async findBySlug(slug: string): Promise<OrganizationResponseDto | null> {
    this.logger.log(`OrganizationsRepository.findBySlug: ${slug}`);
    return null;
  }

  async findAll(): Promise<OrganizationResponseDto[]> {
    return [];
  }

  async create(data: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    this.logger.log(`OrganizationsRepository.create: ${data.name}`);
    return {
      id: '01915dfa-9012-7000-8000-000000000001',
      name: data.name,
      slug: data.slug,
      taxIdentifier: data.taxIdentifier,
      subscriptionPlan: 'trial',
      subscriptionStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async update(
    id: string,
    data: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    this.logger.log(`OrganizationsRepository.update: ${id}`);
    return {
      id,
      name: data.name || 'Organization',
      slug: 'org-slug',
      taxIdentifier: data.taxIdentifier,
      subscriptionPlan: 'pro',
      subscriptionStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async delete(id: string): Promise<boolean> {
    this.logger.log(`OrganizationsRepository.delete: ${id}`);
    return true;
  }
}
