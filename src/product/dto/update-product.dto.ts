import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsNotEmpty, Min } from 'class-validator';
import CreateProductDto from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  id: number;
}
