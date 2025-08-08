import { PartialType } from '@nestjs/mapped-types';
import CreateUserDto from './create-user.dto';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  id: number;
}

export default UpdateUserDto;
