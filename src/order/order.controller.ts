import { Controller } from '@nestjs/common';
import { OrderService } from './order.service';
import { GrpcMethod } from '@nestjs/microservices';
import GetOrderDto from './dto/get-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import DeleteOrderDto from './dto/delete-order.dto';
import UpdateOrderDto from './dto/update-order.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod('OrderService', 'GetOrder')
  findOne(getOrderDto: GetOrderDto) {
    return this.orderService.findOne(getOrderDto);
  }

  @GrpcMethod('OrderService', 'ListOrders')
  findAll() {
    return this.orderService.findAll();
  }

  @GrpcMethod('OrderService', 'ListOrdersByUserId')
  findByUserId(getOrderDto: GetOrderDto) {
    return this.orderService.findByUserId(getOrderDto);
  }

  @GrpcMethod('OrderService', 'CreateOrder')
  create(createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @GrpcMethod('OrderService', 'UpdateOrder')
  update(updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(updateOrderDto);
  }

  @GrpcMethod('OrderService', 'DeleteOrder')
  delete(deleteOrderDto: DeleteOrderDto) {
    return this.orderService.delete(deleteOrderDto);
  }
}
