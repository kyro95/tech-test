import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import UpdateOrderDto from './dto/update-order.dto';
import GetOrderDto from './dto/get-order.dto';
import DeleteOrderDto from './dto/delete-order.dto';
import { EntityManager, In } from 'typeorm';
import { defer, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Order } from './order.entity';
import { User } from '../user/user.entity';
import { Product } from '../product/product.entity';
import { OrderStatus } from './types';

@Injectable()
export class OrderService {
  constructor(private readonly entityManager: EntityManager) {}
  findOne(getOrderDto: GetOrderDto) {
    const { id } = getOrderDto;

    return from(
      this.entityManager.findOne(Order, {
        where: { id },
        relations: ['user', 'products'],
      }),
    ).pipe(
      map((order) => {
        if (!order) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `Order with id ${id} not found`,
          });
        }

        return order;
      }),
    );
  }

  findAll() {
    return from(
      this.entityManager.find(Order, {
        relations: ['user', 'products'],
      }),
    ).pipe(
      map((orders) => {
        return {
          orders,
        };
      }),
    );
  }

  findByUserId(getOrderDto: GetOrderDto) {
    const { id: userId } = getOrderDto;

    return from(
      this.entityManager.find(Order, {
        where: { user: { id: userId } },
        relations: ['user', 'products'],
      }),
    ).pipe(
      map((orders) => {
        if (!orders.length) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `No orders found for user with id ${userId}`,
          });
        }

        return {
          orders,
        };
      }),
    );
  }

  public async getTotalOrderCountAndSum(
    productIds: number[],
    transactionalEntityManager: EntityManager,
  ): Promise<{ count: number; totalAmount: number }> {
    const result = await transactionalEntityManager
      .createQueryBuilder(Product, 'p')
      .select(['COUNT(p.id) as product_count', 'SUM(p.price) as total_amount'])
      .where('p.id IN (:...ids)', { ids: productIds })
      .getRawOne<{ product_count: string; total_amount: string | null }>();

    return {
      count: parseInt(result?.product_count ?? '0'),
      totalAmount: parseFloat(result?.total_amount ?? '0'),
    };
  }

  create(createOrderDto: CreateOrderDto) {
    return defer(() =>
      from(
        this.entityManager.transaction(async (transactionalEntityManager) => {
          const userExists = await transactionalEntityManager.exists(User, {
            where: { id: createOrderDto.userId },
          });

          if (!userExists) {
            throw new RpcException({
              code: status.NOT_FOUND,
              message: 'User not found',
            });
          }

          const result = await this.getTotalOrderCountAndSum(
            createOrderDto.productIds,
            transactionalEntityManager,
          );

          if (result.count !== createOrderDto.productIds.length) {
            throw new RpcException({
              code: status.NOT_FOUND,
              message: 'One or more products not found',
            });
          }

          const order = transactionalEntityManager.create(Order, {
            user: { id: createOrderDto.userId },
            products: createOrderDto.productIds.map((id) => ({ id })),
            totalAmount: result.totalAmount,
          });

          const savedOrder = await transactionalEntityManager.save(order);
          return transactionalEntityManager.findOne(Order, {
            where: { id: savedOrder.id },
            relations: ['user', 'products'],
          });
        }),
      ),
    );
  }

  update(updateOrderDto: UpdateOrderDto) {
    const { id, ...updateData } = updateOrderDto;

    return defer(() =>
      from(
        this.entityManager.transaction(async (transactionalEntityManager) => {
          const order = await transactionalEntityManager.findOne(Order, {
            where: { id },
            relations: ['user', 'products'],
          });

          if (!order) {
            throw new RpcException({
              code: status.NOT_FOUND,
              message: `Order with id ${id} not found`,
            });
          }

          if (order.status >= OrderStatus.SHIPPED) {
            throw new RpcException({
              code: status.FAILED_PRECONDITION,
              message: `Order cannot be modified after being shipped`,
            });
          }

          if (updateData.productIds) {
            const { count, totalAmount } = await this.getTotalOrderCountAndSum(
              updateData.productIds,
              transactionalEntityManager,
            );

            if (count !== updateData.productIds.length) {
              throw new RpcException({
                code: status.NOT_FOUND,
                message: 'One or more products not found',
              });
            }

            order.totalAmount = totalAmount;
            order.products = await transactionalEntityManager.find(Product, {
              where: { id: In(updateData.productIds) },
              select: ['id'],
            });
          }

          if (updateData.userId) {
            const user = await transactionalEntityManager.findOne(User, {
              where: { id: updateData.userId },
              select: ['id'],
            });

            if (!user) {
              throw new RpcException({
                code: status.NOT_FOUND,
                message: 'User not found',
              });
            }

            order.user = user;
          }

          if (updateData.status) {
            order.status = updateData.status;
          }

          await transactionalEntityManager.save(order);
          return transactionalEntityManager.findOne(Order, {
            where: { id },
            relations: ['user', 'products'],
          });
        }),
      ),
    );
  }

  delete(deleteOrderDto: DeleteOrderDto) {
    const { id } = deleteOrderDto;

    return from(this.entityManager.delete(Order, { id })).pipe(
      map((result) => {
        if (!result.affected) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `Order with id ${id} not found`,
          });
        }

        return {
          deleted: true,
          message: `Order with id ${id} deleted successfully`,
        };
      }),
    );
  }
}
