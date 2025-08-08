import { INestMicroservice } from '@nestjs/common';
import { OrderServiceClient } from '../src/order/types';
import {
  ClientGrpc,
  ClientsModule,
  RpcException,
  Transport,
} from '@nestjs/microservices';
import { TestingModule, Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { BOOTSTRAP_CONFIG } from '../src/common/config/bootstrap.config';
import { lastValueFrom } from 'rxjs';
import { ProductServiceClient } from '../src/product/types';
import { CreateUserResponse, UserServiceClient } from '../src/user/types';
import { ProductResponse } from '../src/product/types';
import { status } from '@grpc/grpc-js';
import GRPCValidationPipe from '../src/common/pipes/grpc-validation.pipe';

describe('OrderController gRPC (e2e)', () => {
  let app: INestMicroservice;
  let orderService: OrderServiceClient;
  let userService: UserServiceClient;
  let user: CreateUserResponse;
  let product1: ProductResponse;
  let product2: ProductResponse;

  beforeAll(async () => {
    const GRPC_URL = process.env.GRPC_URL || 'localhost:5000';
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ClientsModule.register([
          {
            name: 'ORDER_CLIENT',
            transport: Transport.GRPC,
            options: {
              url: GRPC_URL,
              package: ['user', 'product', 'order'],
              protoPath: [
                'proto/user.proto',
                'proto/product.proto',
                'proto/order.proto',
              ],
            },
          },
        ]),
      ],
    }).compile();

    app = module.createNestMicroservice(BOOTSTRAP_CONFIG);
    app.useGlobalPipes(new GRPCValidationPipe());

    await app.listen();

    const client = module.get<ClientGrpc>('ORDER_CLIENT');
    orderService = client.getService<OrderServiceClient>('OrderService');
    userService = client.getService<UserServiceClient>('UserService');

    user = await lastValueFrom(
      userService.createUser({
        email: new Date().getTime() + '@example.com',
        name: 'User',
      }),
    );

    product1 = await lastValueFrom(
      client.getService<ProductServiceClient>('ProductService').createProduct({
        name: 'Product 1',
        price: 100,
      }),
    );

    product2 = await lastValueFrom(
      client.getService<ProductServiceClient>('ProductService').createProduct({
        name: 'Product 2',
        price: 200,
      }),
    );
  });

  describe('GetOrder', () => {
    it('should return an order by ID', async () => {
      const newOrder = await lastValueFrom(
        orderService.createOrder({
          productIds: [product1.id, product2.id],
          userId: user.id,
        }),
      );

      const order = await lastValueFrom(
        orderService.getOrder({ id: newOrder.id }),
      );

      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.user.id).toBeDefined();
      expect(order.products).toHaveLength(2);
      expect(order.products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: product1.id }),
          expect.objectContaining({ id: product2.id }),
        ]),
      );
    });

    it('should throw NOT FOUND error if order not found', async () => {
      try {
        await lastValueFrom(orderService.getOrder({ id: 10000 }));
      } catch (error) {
        expect(error).toMatchObject({
          code: status.NOT_FOUND,
        });
      }
    });

    it('should throw INVALID_ARGUMENT error if request is invalid', async () => {
      try {
        await lastValueFrom(orderService.getOrder({ id: 0 }));
      } catch (error) {
        expect(error).toMatchObject({
          code: status.INVALID_ARGUMENT,
        });
      }
    });
  });

  describe('CreateOrder', () => {
    it('should create a new order', async () => {
      const order = await lastValueFrom(
        orderService.createOrder({
          productIds: [product1.id, product2.id],
          userId: user.id,
        }),
      );

      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.user.id).toBeDefined();
      expect(order.products).toHaveLength(2);
      expect(order.products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: product1.id }),
          expect.objectContaining({ id: product2.id }),
        ]),
      );
    });

    it('should throw INVALID_ARGUMENT error if request is invalid', async () => {
      try {
        await lastValueFrom(
          orderService.createOrder({ productIds: [], userId: user.id }),
        );
      } catch (error) {
        expect(error).toMatchObject({
          code: status.INVALID_ARGUMENT,
        });
      }
    });
  });

  describe('UpdateOrder', () => {
    it('should update an existing order', async () => {
      const order = await lastValueFrom(
        orderService.createOrder({
          productIds: [product1.id, product2.id],
          userId: user.id,
        }),
      );

      const updatedOrder = await lastValueFrom(
        orderService.updateOrder({
          id: order.id,
          productIds: [product1.id],
          userId: user.id,
        }),
      );

      expect(updatedOrder).toBeDefined();
      expect(updatedOrder.id).toBe(order.id);
      expect(updatedOrder.user.id).toBe(user.id);
      expect(updatedOrder.products).toHaveLength(1);
      expect(updatedOrder.products).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: product1.id })]),
      );
    });

    it('should throw NOT_FOUND error if order to update does not exist', async () => {
      try {
        await lastValueFrom(
          orderService.updateOrder({
            id: 10000,
            productIds: [product1.id],
            userId: user.id,
          }),
        );
      } catch (error) {
        expect(error).toMatchObject({
          code: status.NOT_FOUND,
        });
      }
    });

    it('should throw INVALID_ARGUMENT error if request is invalid', async () => {
      try {
        await lastValueFrom(
          orderService.updateOrder({ id: 0, productIds: [], userId: user.id }),
        );
      } catch (error) {
        expect(error).toMatchObject({
          code: status.INVALID_ARGUMENT,
        });
      }
    });
  });

  describe('DeleteOrder', () => {
    it('should delete an existing order', async () => {
      const order = await lastValueFrom(
        orderService.createOrder({
          productIds: [product1.id, product2.id],
          userId: user.id,
        }),
      );

      const deletedOrder = await lastValueFrom(
        orderService.deleteOrder({ id: order.id }),
      );

      expect(deletedOrder).toBeDefined();
      expect(deletedOrder.deleted).toBe(true);
    });

    it('should throw NOT_FOUND error if order to delete does not exist', async () => {
      try {
        await lastValueFrom(orderService.deleteOrder({ id: 10000 }));
      } catch (error) {
        expect(error).toMatchObject({
          code: status.NOT_FOUND,
        });
      }
    });

    it('should throw INVALID_ARGUMENT error if request is invalid', async () => {
      try {
        await lastValueFrom(orderService.deleteOrder({ id: 0 }));
      } catch (error) {
        expect(error).toMatchObject({
          code: status.INVALID_ARGUMENT,
        });
      }
    });
  });

  describe('ListOrders', () => {
    it('should return a list of orders for a user', async () => {
      const orders = await lastValueFrom(orderService.listOrders({}));

      expect(orders).toBeDefined();
      expect(orders.orders).toBeInstanceOf(Array);
    });
  });

  describe('ListOrdersByUserId', () => {
    it('should return a list of orders for a specific user', async () => {
      const orders = await lastValueFrom(
        orderService.listOrdersByUserId({ id: user.id }),
      );

      expect(orders).toBeDefined();
      expect(orders.orders).toBeInstanceOf(Array);
    });

    it('should return an empty list if the user has no orders', async () => {
      const newUser = await lastValueFrom(
        userService.createUser({
          email: new Date().getTime() + '@example.com',
          name: 'New User',
        }),
      );

      try {
        await lastValueFrom(
          orderService.listOrdersByUserId({ id: newUser.id }),
        );
      } catch (error) {
        expect(error).toMatchObject({
          code: status.NOT_FOUND,
        });
      }
    });

    it('should throw NOT_FOUND error if user does not exist', async () => {
      try {
        await lastValueFrom(orderService.listOrdersByUserId({ id: 10000 }));
      } catch (error) {
        expect(error).toMatchObject({
          code: status.NOT_FOUND,
        });
      }
    });

    it('should throw INVALID_ARGUMENT error if request is invalid', async () => {
      try {
        await lastValueFrom(orderService.listOrdersByUserId({ id: 0 }));
      } catch (error) {
        expect(error).toMatchObject({
          code: status.INVALID_ARGUMENT,
        });
      }
    });
  });

  afterAll(async () => {
    await app.close()
  });
});
