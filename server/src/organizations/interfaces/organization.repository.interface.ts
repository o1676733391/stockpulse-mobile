import { IBaseRepository } from '../../database/base.repository.interface';
import {
  CreateOrganizationDto,
  OrganizationResponseDto,
  UpdateOrganizationDto,
} from '../dto/organization.dto';

export interface IOrganizationRepository
  extends IBaseRepository<
    OrganizationResponseDto,
    CreateOrganizationDto,
    UpdateOrganizationDto
  > {
  findBySlug(slug: string): Promise<OrganizationResponseDto | null>;
}
