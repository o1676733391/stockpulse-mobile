import { Test, TestingModule } from '@nestjs/testing';
import { CreateSupplierDto, SupplierResponseDto, UpdateSupplierDto } from './dto/supplier.dto';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let service: jest.Mocked<SuppliersService>;

  const mockSupplier: SupplierResponseDto = {
    id: 'sup-01',
    storeId: 'store-01',
    supplierCode: 'SUP-01',
    name: 'Fresh Dairy Co',
    contactName: 'John',
    email: 'john@dairy.com',
    phone: '12345',
    leadTimeDays: 2,
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn().mockResolvedValue([mockSupplier]),
      findById: jest.fn().mockResolvedValue(mockSupplier),
      create: jest.fn().mockResolvedValue(mockSupplier),
      update: jest.fn().mockResolvedValue(mockSupplier),
      delete: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SuppliersController>(SuppliersController);
    service = module.get(SuppliersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return suppliers from service', async () => {
      const result = await controller.findAll('store-01');
      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create supplier', async () => {
      const dto: CreateSupplierDto = { supplierCode: 'SUP-01', name: 'Fresh Dairy Co' };
      const result = await controller.create(dto, 'store-01');
      expect(result.supplierCode).toBe('SUP-01');
    });
  });

  describe('update', () => {
    it('should update supplier', async () => {
      const dto: UpdateSupplierDto = { name: 'Updated' };
      const result = await controller.update('sup-01', dto, 'store-01');
      expect(result.id).toBe('sup-01');
    });
  });

  describe('delete', () => {
    it('should delete supplier', async () => {
      const result = await controller.delete('sup-01', 'store-01');
      expect(result.success).toBe(true);
    });
  });
});
