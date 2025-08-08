/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import {
  createEntityManagerMock,
  EntityManagerMock,
} from '../../test-utils/entity-manager.mock';
import { EntityManager } from 'typeorm';
import { Order } from './order.entity';
import { OrderStatus } from './types';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

describe('OrderService', () => {
  let service: OrderService;
  let entityManagerMock: EntityManagerMock;

  const id = 1;
  const userId = 1;
  const productIds = [1, 2, 3];
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
      email: 'test@example.com',
      name: 'User',
    },
    totalAmount: 450,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: EntityManager,
          useValue: createEntityManagerMock(),
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    entityManagerMock = module.get<EntityManagerMock>(EntityManager);
  });

  describe('findOne', () => {
    it('should return an order by ID', (done) => {
      entityManagerMock.findOne.mockResolvedValue(createdOrder);

      service.findOne({ id }).subscribe((o) => {
        expect(o).toEqual(createdOrder);
        done();
      });
    });

    it('should throw NOT_FOUND if order not found', (done) => {
      entityManagerMock.findOne.mockResolvedValue(null);

      service.findOne({ id }).subscribe({
        next: () => {
          done(new Error('Expected NOT_FOUND to be thrown'));
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.NOT_FOUND,
          });
          done();
        },
      });
    });

    it('should throw INTERNAL if an error occurs', (done) => {
      entityManagerMock.findOne.mockRejectedValue(
        new RpcException({
          code: status.INTERNAL,
          message: 'Database error',
        }),
      );

      service.findOne({ id }).subscribe({
        next: () => {
          done.fail('Expected an error to be thrown');
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.INTERNAL,
          });
          done();
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of orders', (done) => {
      entityManagerMock.find.mockResolvedValue([createdOrder]);

      service.findAll().subscribe((orders) => {
        expect(orders).toEqual({ orders: [createdOrder] });
        done();
      });
    });

    it('should throw INTERNAL if an error occurs', (done) => {
      entityManagerMock.find.mockRejectedValue(
        new RpcException({
          code: status.INTERNAL,
          message: 'Database error',
        }),
      );

      service.findAll().subscribe({
        next: () => {
          done.fail('Expected an error to be thrown');
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });
  });

  describe('findByUserId', () => {
    it('should return an array of orders for the given userId', (done) => {
      entityManagerMock.find.mockResolvedValue([createdOrder]);

      service.findByUserId({ id: userId }).subscribe((orders) => {
        expect(orders).toEqual({ orders: [createdOrder] });
        done();
      });
    });

    it('should throw INTERNAL if an error occurs', (done) => {
      entityManagerMock.find.mockRejectedValue(
        new RpcException({
          code: status.INTERNAL,
          message: 'Database error',
        }),
      );

      service.findByUserId({ id: userId }).subscribe({
        next: () => {
          done.fail('Expected an error to be thrown');
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });
  });

  describe('getTotalOrderCountAndSum', () => {
    it('should return the total order count and amount for the given productIds', async () => {
      entityManagerMock.createQueryBuilder().getRawOne.mockResolvedValue({
        product_count: '2',
        total_amount: '200',
      });

      await expect(
        service.getTotalOrderCountAndSum(
          [1, 2],
          entityManagerMock as unknown as EntityManager,
        ),
      ).resolves.toEqual({
        count: 2,
        totalAmount: 200,
      });
    });

    it('should return [0, 0] if no result is found', async () => {
      entityManagerMock
        .createQueryBuilder()
        .getRawOne.mockResolvedValue(undefined);

      await expect(
        service.getTotalOrderCountAndSum(
          [1, 2],
          entityManagerMock as unknown as EntityManager,
        ),
      ).resolves.toEqual({
        count: 0,
        totalAmount: 0,
      });
    });

    it('should throw INTERNAL if an error occurs', async () => {
      entityManagerMock.createQueryBuilder().getRawOne.mockRejectedValue(
        new RpcException({
          code: status.INTERNAL,
          message: 'Database error',
        }),
      );

      await expect(
        service.getTotalOrderCountAndSum(
          [1, 2],
          entityManagerMock as unknown as EntityManager,
        ),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('create', () => {
    it('should create a new order', (done) => {
      entityManagerMock.transaction.mockImplementation((cb) => {
        const transactionalEntityManager = {
          exists: jest.fn().mockResolvedValue(true),
          create: jest.fn().mockReturnValue(createdOrder),
          save: jest.fn().mockResolvedValue(createdOrder),
          findOne: jest.fn().mockResolvedValue(createdOrder),
        };

        jest.spyOn(service, 'getTotalOrderCountAndSum').mockResolvedValue({
          count: productIds.length,
          totalAmount: 100,
        });

        return cb(transactionalEntityManager);
      });

      service.create({ userId, productIds }).subscribe({
        next: (order) => {
          expect(order).toEqual(createdOrder);
          expect(entityManagerMock.transaction).toHaveBeenCalled();
          done();
        },
        error: (err) => done(err),
      });
    });

    it('should throw NOT_FOUND when user not found', (done) => {
      entityManagerMock.transaction.mockImplementation((callback) => {
        const transactionalEntityManager = {
          exists: jest.fn().mockResolvedValue(false),
        };
        return callback(transactionalEntityManager);
      });

      service.create({ userId, productIds }).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (err) => {
          expect(err.message).toBe('User not found');
          done();
        },
      });
    });

    it('should throw error when products not found', (done) => {
      entityManagerMock.transaction.mockImplementation((callback) => {
        const transactionalEntityManager = {
          exists: jest.fn().mockResolvedValue(true),
        };

        jest.spyOn(service, 'getTotalOrderCountAndSum').mockResolvedValue({
          // We simulate that one product is not found by reducing the count
          count: productIds.length - 1,
          totalAmount: 100,
        });

        return callback(transactionalEntityManager);
      });

      service.create({ userId, productIds }).subscribe({
        next: () => done.fail('Should have thrown error'),
        error: (err) => {
          expect(err.message).toBe('One or more products not found');
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should update an existing order', (done) => {
      jest.spyOn(service, 'getTotalOrderCountAndSum').mockResolvedValue({
        count: productIds.length,
        totalAmount: createdOrder.products.reduce(
          (sum, product) => sum + product.price,
          0,
        ),
      });

      entityManagerMock.transaction.mockImplementation((cb) => {
        const transactionalEntityManager = {
          exists: jest.fn().mockResolvedValue(true),
          create: jest.fn().mockReturnValue(createdOrder),
          save: jest.fn().mockResolvedValue(createdOrder),
          findOne: jest.fn().mockResolvedValue(createdOrder),
          find: jest.fn().mockResolvedValue(createdOrder.products),
        };

        return cb(transactionalEntityManager);
      });

      service.update({ id: createdOrder.id, userId, productIds }).subscribe({
        next: (order) => {
          expect(order).toEqual(createdOrder);
          expect(entityManagerMock.transaction).toHaveBeenCalled();
          done();
        },
        error: (err) => done(err),
      });
    });

    it('should throw error when order not found', (done) => {
      entityManagerMock.transaction.mockImplementation((cb) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockResolvedValue(null),
        };

        return cb(transactionalEntityManager);
      });

      service.update({ id: createdOrder.id, userId, productIds }).subscribe({
        next: () => done(new Error('Expected method to throw an error')),
        error: (err) => {
          expect(err).toBeInstanceOf(RpcException);
          expect(err.getError()).toMatchObject({
            code: status.NOT_FOUND,
          });
          done();
        },
      });
    });

    it('should throw error when products not found', (done) => {
      entityManagerMock.transaction.mockImplementation((callback) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockResolvedValue({
            id: createdOrder.id,
            status: OrderStatus.CREATED,
            user: { id: userId },
            products: [],
          }),
          find: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
          save: jest.fn(),
        };

        jest
          .spyOn(service, 'getTotalOrderCountAndSum')
          .mockImplementation(() => {
            return Promise.resolve({
              count: 2,
              totalAmount: 100,
            });
          });

        return callback(transactionalEntityManager);
      });

      service.update({ id: createdOrder.id, userId, productIds }).subscribe({
        next: () => {
          done(new Error('Expected method to throw an error but it succeeded'));
        },
        error: (err) => {
          expect(err).toBeInstanceOf(RpcException);
          expect(err.getError()).toMatchObject({
            code: status.NOT_FOUND,
          });
          done();
        },
      });
    });

    it('should throw error when order is already shipped', (done) => {
      entityManagerMock.transaction.mockImplementation((cb) => {
        const transactionalEntityManager = {
          findOne: jest.fn().mockResolvedValue({
            id: createdOrder.id,
            status: OrderStatus.SHIPPED,
            user: { id: userId },
            products: createdOrder.products,
          }),
        };

        return cb(transactionalEntityManager);
      });

      service.update({ id: createdOrder.id, userId, productIds }).subscribe({
        next: () => {
          done(new Error('Expected method to throw an error but it succeeded'));
        },
        error: (err) => {
          expect(err).toBeInstanceOf(RpcException);
          expect(err.getError()).toMatchObject({
            code: status.FAILED_PRECONDITION,
          });
          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete order successfully', (done) => {
      entityManagerMock.delete.mockResolvedValue({ affected: 1 });

      service.delete({ id: createdOrder.id }).subscribe({
        next: (result) => {
          expect(result).toMatchObject({
            deleted: true,
          });
          done();
        },
        error: (err) => done(err),
      });
    });

    it('should throw error when order not found', (done) => {
      entityManagerMock.delete.mockResolvedValue({ affected: 0 });

      service.delete({ id: createdOrder.id }).subscribe({
        next: () => done(new Error('Expected method to throw an error')),
        error: (err) => {
          expect(err).toBeInstanceOf(RpcException);
          expect(err.getError()).toMatchObject({
            code: status.NOT_FOUND,
          });
          done();
        },
      });
    });
  });
});
