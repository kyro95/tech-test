import { PartialType } from '@nestjs/mapped-types';
import GetProductDto from './get-product.dto';

class DeleteProductDto extends PartialType(GetProductDto) {}

export default DeleteProductDto;
