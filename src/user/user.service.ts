import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { from, Observable, defer } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import CreateUserDto from './dto/create-user.dto';
import UpdateUserDto from './dto/update-user.dto';
import { User } from './user.entity';
import GetUserDto from './dto/get-user.dto';
import DeleteUserDto from './dto/delete-user.dto';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Injectable()
export class UserService {
  constructor(private readonly entityManager: EntityManager) {}

  findOne(getUserDto: GetUserDto): Observable<User> {
    return from(this.entityManager.findOneBy(User, getUserDto)).pipe(
      map((user) => {
        if (!user) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `User with id ${getUserDto.id} not found`,
          });
        }
        return user;
      }),
    );
  }

  findAll() {
    return from(this.entityManager.find(User)).pipe(
      map((users) => ({ users })),
    );
  }

  create(createUserDto: CreateUserDto) {
    const { email } = createUserDto;

    return defer(() =>
      from(
        this.entityManager.transaction(async (transactionalEntityManager) => {
          const existingUser = await transactionalEntityManager.findOne(User, {
            where: { email },
            lock: { mode: 'pessimistic_write' },
          });

          if (existingUser) {
            throw new RpcException({
              code: status.ALREADY_EXISTS,
              message: `User with email ${email} already exists`,
            });
          }

          const user = transactionalEntityManager.create(User, createUserDto);
          return transactionalEntityManager.save(user);
        }),
      ),
    );
  }

  update(updateUserDto: UpdateUserDto) {
    const { id, ...updateData } = updateUserDto;

    return from(this.entityManager.update(User, id, updateData)).pipe(
      switchMap((result) => {
        if (!result.affected) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `User with id ${id} not found`,
          });
        }
        return this.findOne({ id });
      }),
    );
  }

  delete(deleteUserDto: DeleteUserDto) {
    const { id } = deleteUserDto;

    return from(this.entityManager.delete(User, id)).pipe(
      map((result) => {
        if (!result.affected) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: `User with id ${id} not found`,
          });
        }

        return {
          deleted: true,
          message: `User with id ${id} deleted successfully`,
        };
      }),
    );
  }
}
