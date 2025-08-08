import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { createMock } from '@golevelup/ts-jest';
import { Order } from './order.entity';
import { OrderStatus } from './types';
import { of, throwError } from 'rxjs';
import { status } from '@grpc/grpc-js';
import { RpcException } from '@nestjs/microservices';

describe('OrderController', () => {
  let controller: OrderController = createMock<OrderController>();
  const orderServiceMock = createMock<OrderService>();

  const id = 1;
  const userId = 1;
  const productIds = [1, 2, 3];
  const createOrderDto = { userId, productIds };
  const updateOrderDto = { id, userId, productIds };
  const createdOrder: Order = {
    id,
    products: [
      {
        id: 1,
        name: 'Product 1',
        price: 100,
      },
      {
        id: 2,
        name: 'Product 2',
        price: 150,
      },
      {
        id: 3,
        name: 'Product 3',
        price: 200,
      },
    ],
    status: OrderStatus.CREATED,
    user: {
      id: userId,
      email: new Date().getTime() + '@example.com',
      name: 'User',
    },
    totalAmount: 450,
  };

  const updatedOrder: Order = {
    ...createdOrder,
    status: OrderStatus.SHIPPED,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: orderServiceMock }],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  describe('findOne', () => {
    it('should return the expected order', () => {
      orderServiceMock.findOne.mockReturnValue(of(createdOrder));

      controller.findOne({ id }).subscribe((order) => {
        expect(order).toEqual(createdOrder);
      });
    });

    it('should propagate error from the service', () => {
      const error = new RpcException({
        code: status.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });

      orderServiceMock.findOne.mockReturnValue(throwError(() => error));

      controller.findOne({ id }).subscribe({
        next: (order) => {
          expect(order).toBeNull();
        },
        error: (err) => {
          expect(err).toEqual(error);
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of orders', () => {
      orderServiceMock.findAll.mockReturnValue(of({ orders: [createdOrder] }));

      controller.findAll().subscribe((response) => {
        expect(response).toEqual({ orders: [createdOrder] });
      });
    });

    it('should propagate error from the service', () => {
      const error = new RpcException({
        code: status.INTERNAL,
        message: 'Internal server error',
      });

      orderServiceMock.findAll.mockReturnValue(throwError(() => error));

      controller.findAll().subscribe({
        next: (orders) => {
          expect(orders).toBeNull();
        },
        error: (err) => {
          expect(err).toEqual(error);
        },
      });
    });
  });

  describe('findByUserId', () => {
    it('should return an array of orders for the given userId', () => {
      orderServiceMock.findByUserId.mockReturnValue(
        of({ orders: [createdOrder] }),
      );

      controller.findByUserId({ id: userId }).subscribe((response) => {
        expect(response).toEqual({ orders: [createdOrder] });
      });
    });

    it('should propagate error from the service', () => {
      const error = new RpcException({
        code: status.INTERNAL,
        message: 'Internal server error',
      });

      orderServiceMock.findByUserId.mockReturnValue(throwError(() => error));

      controller.findByUserId({ id: userId }).subscribe({
        next: (orders) => {
          expect(orders).toBeNull();
        },
        error: (err) => {
          expect(err).toEqual(error);
        },
      });
    });
  });

  describe('create', () => {
    it('should return the created order', () => {
      orderServiceMock.create.mockReturnValue(of(createdOrder));

      controller.create(createOrderDto).subscribe((order) => {
        expect(order).toEqual(createdOrder);
      });
    });

    it('should propagate error from the service', () => {
      const error = new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });
      orderServiceMock.create.mockReturnValue(throwError(() => error));

      controller.create(createOrderDto).subscribe({
        next: (order) => {
          expect(order).toBeNull();
        },
        error: (err) => {
          expect(err).toEqual(error);
        },
      });
    });
  });

  describe('update', () => {
    it('should return the updated order', () => {
      orderServiceMock.update.mockReturnValue(of(updatedOrder));

      controller.update(updateOrderDto).subscribe((order) => {
        expect(order).toEqual(updatedOrder);
      });
    });

    it('should propagate error from the service', () => {
      const error = new RpcException({
        code: status.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
      orderServiceMock.update.mockReturnValue(throwError(() => error));

      controller.update(updateOrderDto).subscribe({
        next: (order) => {
          expect(order).toBeNull();
        },
        error: (err) => {
          expect(err).toEqual(error);
        },
      });
    });
  });

  describe('delete', () => {
    it('should return a success message', () => {
      orderServiceMock.delete.mockReturnValue(
        of({
          deleted: true,
          message: `Order with id ${id} deleted successfully`,
        }),
      );

      controller.delete({ id }).subscribe((response) => {
        expect(response).toMatchObject({
          deleted: true,
          message: `Order with id ${id} deleted successfully`,
        });
      });
    });

    it('should propagate error from the service', () => {
      const error = new RpcException({
        code: status.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
      orderServiceMock.delete.mockReturnValue(throwError(() => error));

      controller.delete({ id }).subscribe({
        next: (response) => {
          expect(response).toBeNull();
        },
        error: (err) => {
          expect(err).toEqual(error);
        },
      });
    });
  });
});
