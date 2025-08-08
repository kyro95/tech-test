import { INestMicroservice } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { BOOTSTRAP_CONFIG } from '../src/common/config/bootstrap.config';
import GRPCValidationPipe from '../src/common/pipes/grpc-validation.pipe';
import { ClientGrpc, ClientsModule, Transport } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  ProductServiceClient,
  CreateProductRequest,
  UpdateProductRequest,
} from '../src/product/types';
import { status } from '@grpc/grpc-js';
import { OrderServiceClient } from '../src/order/types';

describe('ProductController gRPC (e2e)', () => {
  let app: INestMicroservice;
  let productService: ProductServiceClient;
  let orderService: OrderServiceClient;

  const validCreateProductDto: CreateProductRequest = {
    name: 'Product',
    price: 100,
  };

  const invalidCreateProductDto: CreateProductRequest = {
    name: '',
    price: 0,
  };

  beforeAll(async () => {
    const GRPC_URL = process.env.GRPC_URL || 'localhost:5000';
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        ClientsModule.register([
          {
            name: 'PRODUCT_CLIENT',
            transport: Transport.GRPC,
            options: {
              url: GRPC_URL,
              package: ['product', 'order'],
              protoPath: ['proto/product.proto', 'proto/order.proto'],
            },
          },
        ]),
      ],
    }).compile();

    app = module.createNestMicroservice(BOOTSTRAP_CONFIG);
    app.useGlobalPipes(new GRPCValidationPipe());

    await app.listen();

    const client = module.get<ClientGrpc>('PRODUCT_CLIENT');
    productService = client.getService<
      ProductServiceClient & OrderServiceClient
    >('ProductService');
    orderService = client.getService<OrderServiceClient>('OrderService');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CreateProduct', () => {
    it('should create a new product with valid data', async () => {
      const runtimeName = 'Product-' + new Date().getTime();
      const response = await lastValueFrom(
        productService.createProduct({
          ...validCreateProductDto,
          name: runtimeName,
        }),
      );

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.name).toEqual(runtimeName);
      expect(response.price).toEqual(validCreateProductDto.price);
    });

    it('should return INVALID_ARGUMENT for invalid data', async () => {
      try {
        await lastValueFrom(
          productService.createProduct(invalidCreateProductDto),
        );
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toMatchObject({
          code: status.INVALID_ARGUMENT,
        });
      }
    });
  });

  describe('GetProduct', () => {
    it('should return a product by ID', async () => {
      const createResponse = await lastValueFrom(
        productService.createProduct(validCreateProductDto),
      );

      const response = await lastValueFrom(
        productService.getProduct({ id: createResponse.id }),
      );

      expect(response).toBeDefined();
      expect(response.id).toEqual(createResponse.id);
      expect(response.name).toEqual(validCreateProductDto.name);
      expect(response.price).toEqual(validCreateProductDto.price);
    });

    it('should return NOT_FOUND for non-existing product', async () => {
      try {
        await lastValueFrom(productService.getProduct({ id: 10000 }));
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
        await lastValueFrom(productService.getProduct({ id: 0 }));
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toMatchObject({
          code: status.INVALID_ARGUMENT,
        });
      }
    });
  });

  describe('UpdateProduct', () => {
    it('should update a product with valid data', async () => {
      const createResponse = await lastValueFrom(
        productService.createProduct(validCreateProductDto),
      );

      const updateData: UpdateProductRequest = {
        id: createResponse.id,
        name: 'Updated Product',
        price: 200,
      };

      const updateResponse = await lastValueFrom(
        productService.updateProduct(updateData),
      );

      expect(updateResponse).toBeDefined();
      expect(updateResponse.id).toEqual(createResponse.id);
      expect(updateResponse.name).toEqual(updateData.name);
      expect(updateResponse.price).toEqual(updateData.price);
    });

    it('should return NOT_FOUND if product to update does not exist', async () => {
      try {
        await lastValueFrom(
          productService.updateProduct({
            id: 10000,
            name: 'Non-existent',
            price: 100,
          }),
        );
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toMatchObject({
          code: status.NOT_FOUND,
        });
      }
    });

    it('should return INVALID_ARGUMENT for invalid update data', async () => {
      const createResponse = await lastValueFrom(
        productService.createProduct(validCreateProductDto),
      );

      try {
        await lastValueFrom(
          productService.updateProduct({
            id: createResponse.id,
            name: '',
            price: -100,
          }),
        );
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toMatchObject({
          code: status.INVALID_ARGUMENT,
        });
      }
    });
  });

  describe('DeleteProduct', () => {
    it('should delete a product by ID', async () => {
      const createResponse = await lastValueFrom(
        productService.createProduct(validCreateProductDto),
      );

      const response = await lastValueFrom(
        productService.deleteProduct({ id: createResponse.id }),
      );

      expect(response).toBeDefined();
      expect(response.deleted).toBe(true);
    });

    it('should return NOT_FOUND if product to delete does not exist', async () => {
      try {
        await lastValueFrom(productService.deleteProduct({ id: 10000 }));
        fail('Expected an error to be thrown');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toMatchObject({
          code: status.NOT_FOUND,
        });
      }
    });
  });

  describe('ListProductsByOrderId', () => {
    it('should return products by order ID', async () => {
      const order = await lastValueFrom(
        orderService.createOrder({
          userId: 1,
          productIds: [1, 2],
        }),
      );

      const response = await lastValueFrom(
        productService.listProductsByOrderId({ id: order.id }),
      );

      expect(response).toBeDefined();
      expect(response.products).toBeDefined();
      expect(Array.isArray(response.products)).toBe(true);
    });

    it('should return empty array for non-existent order ID', async () => {
      try {
        await lastValueFrom(
          productService.listProductsByOrderId({ id: 10000 }),
        );
      } catch (error) {
        expect(error).toBeDefined();
        expect(error).toMatchObject({
          code: status.NOT_FOUND,
        });
      }
    });
  });

  describe('ListProducts', () => {
    it('should return a list of products', async () => {
      const response = await lastValueFrom(productService.listProducts({}));

      expect(response).toBeDefined();
      expect(response.products).toBeDefined();
      expect(Array.isArray(response.products)).toBe(true);
    });
  });
});
