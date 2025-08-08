import { PartialType } from '@nestjs/mapped-types';
import GetOrderDto from './get-order.dto';

class DeleteOrderDto extends PartialType(GetOrderDto) {}

export default DeleteOrderDto;
