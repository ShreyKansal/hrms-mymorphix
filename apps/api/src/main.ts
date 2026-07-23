import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Every DTO in the app gets validated at the boundary — this is what makes
  // @atlaskit/form's "clear, specific error" requirement possible to honor consistently
  // (docs/hrms-prd/09-api-and-event-planning.md §8).
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Dev-only permissive CORS so the Vite dev server (localhost:5173) can call this API.
  // Tighten this before anything resembling production per docs/hrms-prd/10-security-privacy-audit.md.
  app.enableCors({ origin: true, credentials: true });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`HRMS API listening on http://localhost:${port}`);
}
bootstrap();
