import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus } from '../types';

class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  id: number;

  @IsOptional()
  @Max(Object.values(OrderStatus).length - 1, {
    message: `status must be a valid order status`,
  })
  @IsInt()
  status?: OrderStatus;
}

export default UpdateOrderDto;
