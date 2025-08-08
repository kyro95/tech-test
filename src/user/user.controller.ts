import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import CreateUserDto from './dto/create-user.dto';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import UpdateUserDto from './dto/update-user.dto';
import GetUserDto from './dto/get-user.dto';
import DeleteUserDto from './dto/delete-user.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @GrpcMethod('UserService', 'GetUser')
  public findOne(getUserDto: GetUserDto) {
    return this.userService.findOne(getUserDto);
  }

  @GrpcMethod('UserService', 'ListUsers')
  public findAll() {
    return this.userService.findAll();
  }

  @GrpcMethod('UserService', 'CreateUser')
  create(data: CreateUserDto) {
    return this.userService.create(data);
  }

  @GrpcMethod('UserService', 'UpdateUser')
  public update(@Payload() updateUserDto: UpdateUserDto) {
    return this.userService.update(updateUserDto);
  }

  @GrpcMethod('UserService', 'DeleteUser')
  public delete(deleteUserDto: DeleteUserDto) {
    return this.userService.delete(deleteUserDto);
  }
}
