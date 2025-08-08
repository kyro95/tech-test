import { PartialType } from '@nestjs/mapped-types';
import GetUserDto from './get-user.dto';

class DeleteUserDto extends PartialType(GetUserDto) {}

export default DeleteUserDto;
