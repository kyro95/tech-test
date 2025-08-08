import { IsString, IsNotEmpty, Length, IsInt, Min } from 'class-validator';

class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  name: string;

  @IsInt()
  @Min(1)
  price: number;
}

export default CreateProductDto;
