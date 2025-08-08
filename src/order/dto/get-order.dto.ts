import { IsInt, IsNotEmpty, Min } from 'class-validator';

class GetOrderDto {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  id: number;
}

export default GetOrderDto;
