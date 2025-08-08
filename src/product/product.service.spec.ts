/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import {
  createEntityManagerMock,
  EntityManagerMock,
} from '../../test-utils/entity-manager.mock';
import { EntityManager } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

describe('ProductService', () => {
  let service: ProductService;
  let entityManagerMock: EntityManagerMock;

  const id = 1;
  const product = { id, name: 'Product', price: 100 };
  const createProductDto = { name: 'Product', price: 100 };
  const updateProductDto = { id, name: 'Updated Product' };
  const updatedProduct = { ...product, name: 'Updated Product' };
  const createdProduct = { id, ...createProductDto };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: EntityManager, useValue: createEntityManagerMock() },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    entityManagerMock = module.get<EntityManagerMock>(EntityManager);
  });

  describe('findOne', () => {
    it('should return a product by ID', (done) => {
      entityManagerMock.findOneBy.mockResolvedValue(product);

      service.findOne({ id }).subscribe((p) => {
        expect(p).toEqual(product);
        done();
      });
    });

    it('should throw NOT_FOUND if product not found', (done) => {
      entityManagerMock.findOneBy.mockResolvedValue(null);

      service.findOne({ id }).subscribe({
        next: () => {
          done.fail('Expected NOT_FOUND to be thrown');
        },
        error: (error) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.NOT_FOUND,
          });
          done();
        },
      });
    });

    it('should throw INTERNAL error if the service fails', (done) => {
      const error = new RpcException({
        code: status.INTERNAL,
        message: 'Internal server error',
      });

      entityManagerMock.findOneBy.mockRejectedValue(error);

      service.findOne({ id }).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBeInstanceOf(RpcException);
          expect(err.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all products', (done) => {
      entityManagerMock.find.mockResolvedValue([product]);

      service.findAll().subscribe((products) => {
        expect(products).toEqual({ products: [product] });
        done();
      });
    });

    it('should throw INTERNAL error if the service fails', (done) => {
      const error = new RpcException({
        code: status.INTERNAL,
        message: 'Internal server error',
      });

      entityManagerMock.find.mockRejectedValue(error);

      service.findAll().subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBeInstanceOf(RpcException);
          expect(err.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });
  });

  describe('findByOrderId', () => {
    it('should return products by order ID', (done) => {
      const order = { id: 1, products: [product] };
      entityManagerMock.find.mockResolvedValue([order]);

      service.findByOrderId({ id: 1 }).subscribe((products) => {
        expect(products).toEqual({ products: [product] });
        done();
      });
    });

    it('should throw NOT_FOUND if no products found for order ID', (done) => {
      entityManagerMock.find.mockResolvedValue([]);

      service.findByOrderId({ id: 1 }).subscribe({
        next: () => {
          done.fail('Expected NOT_FOUND to be thrown');
        },
        error: (error) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.NOT_FOUND,
          });
          done();
        },
      });
    });

    it('should throw INTERNAL error if the service fails', (done) => {
      const error = new RpcException({
        code: status.INTERNAL,
        message: 'Internal server error',
      });

      entityManagerMock.find.mockRejectedValue(error);

      service.findByOrderId({ id: 1 }).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBeInstanceOf(RpcException);
          expect(err.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });
  });

  describe('create', () => {
    it('should create a new product', (done) => {
      entityManagerMock.transaction.mockImplementation((cb) => {
        return cb(entityManagerMock);
      });

      entityManagerMock.create.mockReturnValue(createdProduct);
      entityManagerMock.save.mockResolvedValue(createdProduct);

      service.create(createProductDto).subscribe((result) => {
        expect(result).toEqual(createdProduct);
        done();
      });
    });

    it('should throw internal ERROR if the service fails', (done) => {
      const error = new RpcException({
        code: status.INTERNAL,
        message: 'Internal server error',
      });

      entityManagerMock.transaction.mockImplementation((cb) => {
        return cb(entityManagerMock);
      });

      entityManagerMock.findOne.mockRejectedValue(error);
      entityManagerMock.create.mockReturnValue(createdProduct);
      entityManagerMock.save.mockRejectedValue(error);

      service.create(createProductDto).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBeInstanceOf(RpcException);
          expect(err.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should update an existing product', (done) => {
      entityManagerMock.update.mockResolvedValue({ affected: 1 });
      entityManagerMock.findOneBy.mockResolvedValue(updatedProduct);

      service.update(updateProductDto).subscribe((result) => {
        expect(result).toEqual(updatedProduct);
        done();
      });
    });

    it('should throw NOT_FOUND if product to update does not exist', (done) => {
      entityManagerMock.update.mockResolvedValue({ affected: 0 });

      service.update(updateProductDto).subscribe({
        next: () => {
          done.fail('Expected NOT_FOUND to be thrown');
        },
        error: (error) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.NOT_FOUND,
          });
          done();
        },
      });
    });

    it('should throw INTERNAL error if the service fails', (done) => {
      const error = new RpcException({
        code: status.INTERNAL,
        message: 'Internal server error',
      });

      entityManagerMock.update.mockRejectedValue(error);

      service.update(updateProductDto).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBeInstanceOf(RpcException);
          expect(err.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a product', (done) => {
      entityManagerMock.delete.mockResolvedValue({ affected: 1 });

      service.delete({ id }).subscribe((result) => {
        expect(result).toMatchObject({
          deleted: true,
        });

        done();
      });
    });

    it('should throw NOT_FOUND if product to delete does not exist', (done) => {
      entityManagerMock.delete.mockResolvedValue({ affected: 0 });

      service.delete({ id }).subscribe({
        next: () => {
          done.fail('Expected NOT_FOUND to be thrown');
        },
        error: (error) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.NOT_FOUND,
          });
          done();
        },
      });
    });

    it('should throw INTERNAL error if the service fails', (done) => {
      const error = new RpcException({
        code: status.INTERNAL,
        message: 'Internal server error',
      });

      entityManagerMock.delete.mockRejectedValue(error);

      service.delete({ id }).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBeInstanceOf(RpcException);
          expect(err.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });
  });
});
