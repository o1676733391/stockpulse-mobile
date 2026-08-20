import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { SupabaseAuthGuard } from '../src/common/guards/supabase-auth.guard';
import { TEST_USER_MANAGER } from './fixtures/auth.fixture';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(SupabaseAuthGuard)
    .useValue({
      canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
          req.user = TEST_USER_MANAGER;
          return true;
        }
        // If route is public or no auth guard required
        return false;
      },
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
