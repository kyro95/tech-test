import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { RpcException } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { status } from '@grpc/grpc-js';
import { createMock } from '@golevelup/ts-jest';
import { Product } from './product.entity';

describe('ProductController', () => {
  let controller: ProductController;
  const productServiceMock = createMock<ProductService>();

  const id = 1;
  const orderId = 1;
  const product: Product = {
    id,
    name: 'Product',
    price: 100,
    orders: [],
  };
  const createProductDto = { name: 'Product', price: 100 };
  const updateProductDto = { id, name: 'Updated Product' };
  const updatedProduct = { ...product, name: 'Updated Product' };
  const createdProduct = { id, ...createProductDto };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: productServiceMock,
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
  });

  describe('findOne', () => {
    it('should return a product from the service', (done) => {
      productServiceMock.findOne.mockReturnValue(of(product));
      controller.findOne({ id }).subscribe((result) => {
        expect(productServiceMock.findOne).toHaveBeenCalledWith({ id });
        expect(result).toEqual(product);
        done();
      });
    });

    it('should propagate error from the service', (done) => {
      const error = new RpcException({
        code: status.NOT_FOUND,
        message: 'Product not found',
      });

      productServiceMock.findOne.mockReturnValue(throwError(() => error));

      controller.findOne({ id }).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all products from the service', (done) => {
      productServiceMock.findAll.mockReturnValue(of({ products: [product] }));

      controller.findAll().subscribe((result) => {
        expect(productServiceMock.findAll).toHaveBeenCalled();
        expect(result).toEqual({ products: [product] });
        done();
      });
    });

    it('should propagate error from the service', (done) => {
      const error = new RpcException({
        code: status.INTERNAL,
        message: 'Internal server error',
      });

      productServiceMock.findAll.mockReturnValue(throwError(() => error));

      controller.findAll().subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('findByOrderId', () => {
    it('should return products by order ID from the service', (done) => {
      productServiceMock.findByOrderId.mockReturnValue(
        of({ products: [product] }),
      );
      controller.findByOrderId({ id: orderId }).subscribe((result) => {
        expect(productServiceMock.findByOrderId).toHaveBeenCalledWith({
          id: orderId,
        });
        expect(result).toEqual({ products: [product] });
        done();
      });
    });

    it('should propagate error from the service', (done) => {
      const error = new RpcException({
        code: status.INTERNAL,
        message: 'Internal server error',
      });

      productServiceMock.findByOrderId.mockReturnValue(throwError(() => error));

      controller.findByOrderId({ id: 1 }).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toMatchObject(error);
          done();
        },
      });
    });
  });

  describe('create', () => {
    it('should create a product', (done) => {
      productServiceMock.create.mockReturnValue(of(createdProduct));

      controller.create(createProductDto).subscribe((result) => {
        expect(productServiceMock.create).toHaveBeenCalledWith(
          createProductDto,
        );
        expect(result).toEqual(createdProduct);
        done();
      });
    });

    it('should propagate error from the service', (done) => {
      const error = new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'Product already exists',
      });

      productServiceMock.create.mockReturnValue(throwError(() => error));

      controller.create(createProductDto).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should update a product', (done) => {
      productServiceMock.update.mockReturnValue(of(updatedProduct));

      controller.update(updateProductDto).subscribe((result) => {
        expect(productServiceMock.update).toHaveBeenCalledWith(
          updateProductDto,
        );
        expect(result).toEqual(updatedProduct);
        done();
      });
    });

    it('should propagate error from the service', (done) => {
      const error = new RpcException({
        code: status.NOT_FOUND,
        message: 'Product not found',
      });

      productServiceMock.update.mockReturnValue(throwError(() => error));

      controller.update(updateProductDto).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a product', (done) => {
      const deleteProductResponse = {
        deleted: true,
        message: `Product with id ${id} deleted`,
      };
      productServiceMock.delete.mockReturnValue(of(deleteProductResponse));

      controller.delete({ id }).subscribe((result) => {
        expect(productServiceMock.delete).toHaveBeenCalledWith({ id });
        expect(result).toMatchObject({
          deleted: true,
        });
        done();
      });
    });

    it('should propagate error from the service', (done) => {
      const error = new RpcException({
        code: status.NOT_FOUND,
        message: 'Product not found',
      });

      productServiceMock.delete.mockReturnValue(throwError(() => error));

      controller.delete({ id }).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });
});
