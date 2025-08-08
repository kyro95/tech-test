import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  @Min(1)
  userId: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Min(1, { each: true })
  productIds: number[];
}
