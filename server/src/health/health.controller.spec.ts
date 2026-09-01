import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return 200 OK with proper health schema', () => {
    const health = controller.check();

    expect(health).toBeDefined();
    expect(health.status).toBe('ok');
    expect(typeof health.timestamp).toBe('string');
    expect(typeof health.uptimeSeconds).toBe('number');
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(health.version).toBeDefined();
    expect(health.environment).toBeDefined();
    expect(health.services.database).toBe('supabase-postgresql');
    expect(health.services.ocr).toBeDefined();
  });

  it('should not leak any secrets or sensitive credentials in response', () => {
    const health = controller.check();
    const stringified = JSON.stringify(health);

    expect(stringified).not.toContain('key');
    expect(stringified).not.toContain('secret');
    expect(stringified).not.toContain('password');
    expect(stringified).not.toContain('bearer');
    expect(stringified).not.toContain('token');
  });
});
