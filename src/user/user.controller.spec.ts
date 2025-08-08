import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { of, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { createMock } from '@golevelup/ts-jest';
import { User } from './user.entity';

describe('UserController', () => {
  let controller: UserController;
  const userServiceMock = createMock<UserService>();

  const id = 1;
  const user: User = { id, name: 'User', email: 'test@example.com' };
  const createUserDto = { name: 'User', email: 'test@example.com' };
  const updateUserDto = { id, name: 'Updated User' };
  const updatedUser = { ...user, name: 'Updated User' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userServiceMock }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  describe('findOne', () => {
    it('should return a user from the service', function (done: jest.DoneCallback) {
      userServiceMock.findOne.mockReturnValue(of(user));
      controller.findOne({ id }).subscribe((result) => {
        expect(userServiceMock.findOne).toHaveBeenCalledWith({ id });
        expect(result).toEqual(user);
        done();
      });
    });

    it('should propagate error from the service', (done) => {
      const error = new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });

      userServiceMock.findOne.mockReturnValue(throwError(() => error));

      controller.findOne({ id }).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all users from the service', (done) => {
      userServiceMock.findAll.mockReturnValue(of({ users: [user] }));

      controller.findAll().subscribe((result) => {
        expect(userServiceMock.findAll).toHaveBeenCalled();
        expect(result).toEqual({ users: [user] });
        done();
      });
    });

    it('should propagate error from the service', (done) => {
      const error = new RpcException({
        code: status.INTERNAL,
        message: 'Internal server error',
      });

      userServiceMock.findAll.mockReturnValue(throwError(() => error));

      controller.findAll().subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('create', () => {
    it('should create a new user', (done) => {
      userServiceMock.create.mockReturnValue(of(user));

      controller.create(createUserDto).subscribe((result) => {
        expect(userServiceMock.create).toHaveBeenCalledWith(createUserDto);
        expect(result).toEqual(user);
        done();
      });
    });

    it('should propagate error from the service', (done) => {
      const error = new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'User already exists',
      });

      userServiceMock.create.mockReturnValue(throwError(() => error));

      controller.create(createUserDto).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('update', () => {
    it('should update an existing user', (done) => {
      userServiceMock.update.mockReturnValue(of(updatedUser));

      controller.update(updateUserDto).subscribe((result) => {
        expect(userServiceMock.update).toHaveBeenCalledWith(updateUserDto);
        expect(result).toMatchObject(updatedUser);
        done();
      });
    });

    it('should propagate error from the service', (done) => {
      const error = new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });

      userServiceMock.update.mockReturnValue(throwError(() => error));

      controller.update(updateUserDto).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a user by id', (done) => {
      const result = {
        deleted: true,
        message: 'User with id 1 deleted successfully',
      };

      userServiceMock.delete.mockReturnValue(of(result));

      controller.delete({ id }).subscribe((res) => {
        expect(userServiceMock.delete).toHaveBeenCalledWith({ id });
        expect(res).toMatchObject(result);
        done();
      });
    });

    it('should propagate error from the service', (done) => {
      const error = new RpcException({
        code: status.NOT_FOUND,
        message: 'User not found',
      });

      userServiceMock.delete.mockReturnValue(throwError(() => error));

      controller.delete({ id }).subscribe({
        next: () => {
          done.fail('Expected an error');
        },
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });
  });
});
