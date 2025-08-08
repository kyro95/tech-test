import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions } from '@nestjs/microservices';
import GRPCValidationPipe from './common/pipes/grpc-validation.pipe';
import { BOOTSTRAP_CONFIG } from './common/config/bootstrap.config';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    BOOTSTRAP_CONFIG,
  );

  app.useGlobalPipes(
    new GRPCValidationPipe({
      transform: true,
    }),
  );

  await app.listen();
}

bootstrap();
