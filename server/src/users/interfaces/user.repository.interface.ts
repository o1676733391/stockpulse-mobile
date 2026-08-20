import { IBaseRepository } from '../../database/base.repository.interface';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dto/user.dto';

export interface IUserRepository
  extends IBaseRepository<UserResponseDto, CreateUserDto, UpdateUserDto> {
  findByEmail(email: string): Promise<UserResponseDto | null>;
  findByOrganization(organizationId: string): Promise<UserResponseDto[]>;
}
