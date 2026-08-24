import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SuppliersController } from '../suppliers.controller';
import { SuppliersRepository } from '../suppliers.repository';
import { SuppliersService } from '../suppliers.service';

describe('Suppliers - Authorization, CRUD & Lifecycle Tests', () => {
  let service: SuppliersService;
  let repository: SuppliersRepository;
  let reflector: Reflector;
  let rolesGuard: RolesGuard;

  const mockSupplier = {
    id: '01915dfa-b1c4-7221-9988-51b72e04e020',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    supplierCode: 'SUP-DAIRY-01',
    name: 'Alpine Fresh Dairy Supplies',
    contactName: 'Hans Gruber',
    email: 'orders@alpinedairy.com',
    phone: '+1-555-0199',
    leadTimeDays: 2,
    paymentTerms: 'Net 30',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);

    repository = {
      findAll: jest.fn().mockResolvedValue([mockSupplier]),
      findById: jest.fn().mockResolvedValue(mockSupplier),
      create: jest.fn().mockResolvedValue(mockSupplier),
      update: jest.fn().mockResolvedValue({ ...mockSupplier, name: 'Alpine Dairy Corp' }),
      delete: jest.fn().mockResolvedValue(true),
    } as unknown as SuppliersRepository;

    service = new SuppliersService(repository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createMockContext = (userRole: string): ExecutionContext => {
    return {
      getHandler: () => SuppliersController.prototype.create,
      getClass: () => SuppliersController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-01', role: userRole },
          headers: { 'x-store-id': '01915dfa-9012-7000-8000-000000000002' },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('1. CRUD & Archiving Workflow', () => {
    it('should create new contracted supplier', async () => {
      const dto = {
        supplierCode: 'SUP-DAIRY-01',
        name: 'Alpine Fresh Dairy Supplies',
        contactName: 'Hans Gruber',
        email: 'orders@alpinedairy.com',
        phone: '+1-555-0199',
        leadTimeDays: 2,
      };

      const result = await service.create(dto, '01915dfa-9012-7000-8000-000000000002');
      expect(result.id).toBe('01915dfa-b1c4-7221-9988-51b72e04e020');
      expect(repository.create).toHaveBeenCalledWith(dto, '01915dfa-9012-7000-8000-000000000002');
    });

    it('should update supplier details', async () => {
      const updateDto = { name: 'Alpine Dairy Corp' };
      const result = await service.update('01915dfa-b1c4-7221-9988-51b72e04e020', updateDto, '01915dfa-9012-7000-8000-000000000002');

      expect(result.name).toBe('Alpine Dairy Corp');
      expect(repository.update).toHaveBeenCalledWith('01915dfa-b1c4-7221-9988-51b72e04e020', updateDto, '01915dfa-9012-7000-8000-000000000002');
    });

    it('should archive / soft-delete supplier', async () => {
      const success = await service.delete('01915dfa-b1c4-7221-9988-51b72e04e020', '01915dfa-9012-7000-8000-000000000002');
      expect(success).toBe(true);
      expect(repository.delete).toHaveBeenCalledWith('01915dfa-b1c4-7221-9988-51b72e04e020', '01915dfa-9012-7000-8000-000000000002');
    });
  });

  describe('2. RBAC Role Guards', () => {
    it('should allow manager and superadmin to manage suppliers', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['superadmin', 'manager']);

      const managerCtx = createMockContext('manager');
      expect(rolesGuard.canActivate(managerCtx)).toBe(true);

      const adminCtx = createMockContext('superadmin');
      expect(rolesGuard.canActivate(adminCtx)).toBe(true);
    });

    it('should reject staff and auditor from creating/deleting suppliers', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['superadmin', 'manager']);

      const staffCtx = createMockContext('staff');
      expect(() => rolesGuard.canActivate(staffCtx)).toThrow();

      const auditorCtx = createMockContext('auditor');
      expect(() => rolesGuard.canActivate(auditorCtx)).toThrow();
    });
  });
});
