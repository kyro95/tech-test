import { INestMicroservice } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { BOOTSTRAP_CONFIG } from '../src/common/config/bootstrap.config';
import GRPCValidationPipe from '../src/common/pipes/grpc-validation.pipe';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { UserServiceClient, CreateUserRequest } from '../src/user/types';
import { status } from '@grpc/grpc-js';
import { DataSource } from 'typeorm';

describe('UserController gRPC (e2e)', () => {
  let app: INestMicroservice;
  let client: ClientGrpc;
  let userService: UserServiceClient;

  const validCreateUserDto: CreateUserRequest = {
    name: 'User',
    email: 'test@example.com',
  };

  const invalidCreateUserDto: CreateUserRequest = {
    name: '',
    email: 'invalid',
  };

  beforeAll(async () => {
    const GRPC_URL = process.env.GRPC_URL || 'localhost:5000';

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ClientsModule.register([
          {
            name: 'USER_CLIENT',
            transport: Transport.GRPC,
            options: {
              url: GRPC_URL,
              package: 'user',
              protoPath: 'proto/user.proto',
              channelOptions: {
                'grpc.enable_retries': 0,
                'grpc.max_connection_age_ms': 10000,
              },
            },
          },
        ]),
      ],
    }).compile();

    app = module.createNestMicroservice(BOOTSTRAP_CONFIG);
    app.useGlobalPipes(new GRPCValidationPipe());

    await app.listen();

    client = module.get<ClientGrpc>('USER_CLIENT');
    userService = client.getService<UserServiceClient>('UserService');
  });

  describe('CreateUser', () => {
    it('should create a new user with valid data', async () => {
      const runtimeEmail = new Date().getTime() + validCreateUserDto.email;
      const response = await lastValueFrom(
        userService.createUser({ ...validCreateUserDto, email: runtimeEmail }),
      );

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toEqual(validCreateUserDto.name);
      expect(response.email).toEqual(runtimeEmail);
    });

    it('should return INVALID_ARGUMENT for invalid data', async () => {
      try {
        await lastValueFrom(userService.createUser(invalidCreateUserDto));
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toMatchObject({
          code: status.INVALID_ARGUMENT,
        });
      }
    });
  });

  describe('GetUser', () => {
    it('should return a user by ID', async () => {
      const userId = 1;
      const response = await lastValueFrom(userService.getUser({ id: userId }));

      expect(response).toBeDefined();
      expect(response.id).toEqual(userId);
    });

    it('should return NOT_FOUND for non-existing user', async () => {
      try {
        await lastValueFrom(userService.getUser({ id: 10000 }));
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toMatchObject({
          code: status.NOT_FOUND,
        });
      }
    });

    it('should return INVALID_ARGUMENT for invalid ID', async () => {
      try {
        await lastValueFrom(userService.getUser({ id: 0 }));
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toMatchObject({
          code: status.INVALID_ARGUMENT,
        });
      }
    });
  });

  describe('UpdateUser', () => {
    it('should update a user with valid data', async () => {
      const runtimeEmail = new Date().getTime() + validCreateUserDto.email;
      const createResponse = await lastValueFrom(
        userService.createUser({ ...validCreateUserDto, email: runtimeEmail }),
      );

      const updateResponse = await lastValueFrom(
        userService.updateUser({ id: createResponse.id, name: 'Updated User' }),
      );

      expect(updateResponse).toBeDefined();
      expect(updateResponse.id).toEqual(createResponse.id);
      expect(updateResponse.name).toEqual('Updated User');
    });

    it('should return NOT_FOUND if user to update does not exist', async () => {
      try {
        await lastValueFrom(
          userService.updateUser({ id: 10000, ...validCreateUserDto }),
        );
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toMatchObject({
          code: status.NOT_FOUND,
        });
      }
    });
  });

  describe('DeleteUser', () => {
    it('should delete a user by ID', async () => {
      const runtimeEmail = new Date().getTime() + validCreateUserDto.email;
      const createResponse = await lastValueFrom(
        userService.createUser({ ...validCreateUserDto, email: runtimeEmail }),
      );

      const response = await lastValueFrom(
        userService.deleteUser({ id: createResponse.id }),
      );
      expect(response).toBeDefined();
      expect(response.deleted).toBe(true);
    });

    it('should return NOT_FOUND if user to delete does not exist', async () => {
      try {
        await lastValueFrom(userService.deleteUser({ id: 10000 }));
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toMatchObject({
          code: status.NOT_FOUND,
        });
      }
    });
  });

  describe('ListUsers', () => {
    it('should return a list of users', async () => {
      const response = await lastValueFrom(userService.listUsers({}));

      expect(response).toBeDefined();
      expect(response.users.length).toBeGreaterThanOrEqual(0);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
