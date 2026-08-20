import { Test, TestingModule } from '@nestjs/testing';
import { CreateSupplierDto, SupplierResponseDto, UpdateSupplierDto } from './dto/supplier.dto';
import { SuppliersRepository } from './suppliers.repository';
import { SuppliersService } from './suppliers.service';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let repository: jest.Mocked<SuppliersRepository>;

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
    const mockRepo = {
      findAll: jest.fn().mockResolvedValue([mockSupplier]),
      findById: jest.fn().mockResolvedValue(mockSupplier),
      findByCode: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(mockSupplier),
      update: jest.fn().mockResolvedValue(mockSupplier),
      delete: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: SuppliersRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    repository = module.get(SuppliersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return suppliers', async () => {
      const result = await service.findAll('store-01');
      expect(result).toHaveLength(1);
      expect(result[0].supplierCode).toBe('SUP-01');
    });
  });

  describe('create', () => {
    it('should create supplier', async () => {
      const dto: CreateSupplierDto = {
        supplierCode: 'SUP-01',
        name: 'Fresh Dairy Co',
      };
      const result = await service.create(dto, 'store-01');
      expect(result.name).toBe('Fresh Dairy Co');
    });
  });

  describe('update', () => {
    it('should update supplier', async () => {
      const dto: UpdateSupplierDto = { name: 'Updated Dairy' };
      const result = await service.update('sup-01', dto, 'store-01');
      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete supplier', async () => {
      const result = await service.delete('sup-01', 'store-01');
      expect(result).toBe(true);
    });
  });
});
