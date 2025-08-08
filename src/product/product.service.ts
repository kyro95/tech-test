import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { defer, from, map, switchMap } from 'rxjs';
import { EntityManager } from 'typeorm';
import CreateProductDto from './dto/create-product.dto';
import DeleteProductDto from './dto/delete-product.dto';
import GetProductDto from './dto/get-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './product.entity';
import { status } from '@grpc/grpc-js';
import { Order } from '../order/order.entity';

@Injectable()
export class ProductService {
  constructor(private readonly entityManager: EntityManager) {}

  findOne(getProductDto: GetProductDto) {
    const { id } = getProductDto;

    return from(this.entityManager.findOneBy(Product, { id })).pipe(
      map((product) => {
        if (!product) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `Product with id ${id} not found`,
          });
        }

        return product;
      }),
    );
  }

  findAll() {
    return from(this.entityManager.find(Product)).pipe(
      map((products) => {
        return {
          products: products,
        };
      }),
    );
  }

  findByOrderId(getProductDto: GetProductDto) {
    const { id: orderId } = getProductDto;

    return from(
      this.entityManager.find(Order, {
        where: { id: orderId },
        relations: ['products'],
      }),
    ).pipe(
      map((orders) => {
        if (!orders || orders.length === 0) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `Products for order with id ${orderId} not found`,
          });
        }

        return {
          products: orders.flatMap((order) => order.products),
        };
      }),
    );
  }

  create(createProductDto: CreateProductDto) {
    return defer(() =>
      from(
        this.entityManager.transaction(async (transactionalEntityManager) => {
          const product = transactionalEntityManager.create(
            Product,
            createProductDto,
          );
          return transactionalEntityManager.save(product);
        }),
      ),
    );
  }

  update(updateProductDto: UpdateProductDto) {
    const { id, ...updateData } = updateProductDto;

    return from(this.entityManager.update(Product, id, updateData)).pipe(
      switchMap((result) => {
        if (!result.affected) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `Product with id ${id} not found`,
          });
        }

        return this.findOne({ id });
      }),
    );
  }

  delete(deleteProductDto: DeleteProductDto) {
    const { id } = deleteProductDto;

    return from(this.entityManager.delete(Product, id)).pipe(
      map((result) => {
        if (!result.affected) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `Product with id ${id} not found`,
          });
        }

        return { deleted: true, message: `Product with id ${id} deleted` };
      }),
    );
  }
}
