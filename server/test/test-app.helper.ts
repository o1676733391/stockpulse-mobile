import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/database/supabase.service';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(SupabaseService)
    .useValue({
      getAdminClient: jest.fn(() => null), // Returns null so all guards & repos use deterministic in-memory mock mode
      getAnonClient: jest.fn(() => null),
    })
    .compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('/api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}
