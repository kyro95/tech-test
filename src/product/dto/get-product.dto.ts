import { IsInt, Min } from 'class-validator';

class GetProductDto {
  @IsInt()
  @Min(1)
  id: number;
}

export default GetProductDto;
