import { ReflectionService } from '@grpc/reflection';
import { NestMicroserviceOptions } from '@nestjs/common/interfaces/microservices/nest-microservice-options.interface';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

type BootstrapConfig = NestMicroserviceOptions & MicroserviceOptions;

export const BOOTSTRAP_CONFIG: BootstrapConfig = {
  transport: Transport.GRPC,
  options: {
    url: process.env.GRPC_URL ?? '0.0.0.0:5000',
    package: ['user', 'order', 'product'],
    protoPath: ['proto/user.proto', 'proto/order.proto', 'proto/product.proto'],
    onLoadPackageDefinition: (pkg, server) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      new ReflectionService(pkg).addToServer(server);
    },
  },
  logger: ['log', 'error', 'warn', 'debug', 'verbose'],
};
