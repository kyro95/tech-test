import {
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

class GRPCValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      ...options,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors
          .flatMap((error) => Object.values(error.constraints || {}))
          .join('; ');
        return new RpcException({
          code: status.INVALID_ARGUMENT,
          message: messages,
        });
      },
    });
  }
}

export default GRPCValidationPipe;
