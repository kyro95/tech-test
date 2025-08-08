import { IsInt, Min } from 'class-validator';

class GetUserDto {
  @IsInt()
  @Min(1)
  id: number;
}

export default GetUserDto;
