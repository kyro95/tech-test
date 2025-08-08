/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import {
  createEntityManagerMock,
  type EntityManagerMock,
} from '../../test-utils/entity-manager.mock';
import { EntityManager } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { User } from './user.entity';
import { of } from 'rxjs';

describe('UserService', () => {
  let service: UserService;
  let entityManagerMock: EntityManagerMock;

  const id = 1;
  const user = { id, name: 'User', email: 'test@example.com' };
  const createUserDto = { name: 'User', email: 'test@example.com' };
  const updateUserDto = { id, name: 'Updated User' };
  const updatedUser = { ...user, name: 'Updated User' };
  const createdUser = { id, ...createUserDto };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: EntityManager, useValue: createEntityManagerMock() },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    entityManagerMock = module.get<EntityManagerMock>(EntityManager);
  });

  describe('findOne', () => {
    it('should return a user by ID', (done) => {
      entityManagerMock.findOneBy.mockResolvedValue(user);

      service.findOne({ id }).subscribe((u) => {
        expect(u).toEqual(user);
        done();
      });
    });

    it('should throw NOT_FOUND if user not found', (done) => {
      entityManagerMock.findOneBy.mockResolvedValue(null);

      service.findOne({ id }).subscribe({
        next: () => {
          done.fail('Expected NOT_FOUND to be thrown');
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.NOT_FOUND,
          });
          done();
        },
      });
    });

    it('should throw INTERNAL if an error occurs', (done) => {
      entityManagerMock.findOneBy.mockRejectedValue(
        new RpcException({
          code: status.INTERNAL,
          message: 'Database error',
        }),
      );

      service.findOne({ id }).subscribe({
        next: () => {
          done.fail('Expected an error to be thrown');
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all users', (done) => {
      entityManagerMock.find.mockReturnValue(of([user]));

      service.findAll().subscribe((users) => {
        expect(users).toEqual({ users: [user] });
        done();
      });
    });

    it('should throw an INTERNAL error if an error occurs', (done) => {
      entityManagerMock.find.mockRejectedValue(
        new RpcException({
          code: status.INTERNAL,
          message: 'Database error',
        }),
      );

      service.findAll().subscribe({
        next: () => {
          done.fail('Expected an error to be thrown');
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });
  });

  describe('create', () => {
    it('should create a new user', (done) => {
      entityManagerMock.transaction.mockImplementation((cb) => {
        return cb(entityManagerMock);
      });

      entityManagerMock.findOne.mockResolvedValue(null);
      entityManagerMock.create.mockReturnValue(createdUser);
      entityManagerMock.save.mockResolvedValue(createdUser);

      service.create(createUserDto).subscribe({
        next: (user) => {
          expect(user).toMatchObject(createdUser);
          done();
        },
        error: () => {
          done.fail('Expected user to be created successfully');
        },
      });
    });

    it('should throw ALREADY_EXISTS if user with email already exists', (done) => {
      entityManagerMock.transaction.mockImplementation((cb) => {
        return cb(entityManagerMock);
      });

      entityManagerMock.findOne.mockResolvedValue(createUserDto);

      service.create(createUserDto).subscribe({
        next: () => {
          done.fail('Expected ALREADY_EXISTS to be thrown');
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.ALREADY_EXISTS,
          });
          done();
        },
      });
    });

    it('should throw an INTERNAL error if saving the user fails', (done) => {
      entityManagerMock.transaction.mockImplementation((cb) => {
        return cb(entityManagerMock);
      });

      entityManagerMock.create.mockReturnValue(createUserDto);
      entityManagerMock.save.mockRejectedValue(
        new RpcException({
          code: status.INTERNAL,
          message: 'Failed to create user',
        }),
      );

      service.create(createUserDto).subscribe({
        next: () => {
          done.fail('Expected an error to be thrown');
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });

    it('should lock row when checking for existing user', (done) => {
      entityManagerMock.transaction.mockImplementation((cb) => {
        return cb(entityManagerMock);
      });

      entityManagerMock.create.mockReturnValue(createdUser);
      entityManagerMock.save.mockResolvedValue(createdUser);

      service.create(createUserDto).subscribe({
        next: () => {
          expect(entityManagerMock.findOne).toHaveBeenCalledWith(User, {
            where: { email: createUserDto.email },
            lock: { mode: 'pessimistic_write' },
          });
          done();
        },
        error: () => {
          done.fail('Expected user to be created successfully');
        },
      });
    });
  });

  describe('update', () => {
    it('should update a existing user', (done) => {
      entityManagerMock.update.mockResolvedValue({ affected: 1 });
      entityManagerMock.findOneBy.mockResolvedValue(updatedUser);

      service.update(updateUserDto).subscribe({
        next: (user) => {
          expect(user).toEqual(updatedUser);
          done();
        },
        error: () => {
          done.fail('Expected user to be updated successfully');
        },
      });
    });

    it('should throw NOT_FOUND error if user to update does not exist', (done) => {
      entityManagerMock.update.mockResolvedValue({ affected: 0 });

      service.update(updateUserDto).subscribe({
        next: () => {
          done.fail('Expected NOT_FOUND error to be thrown');
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.NOT_FOUND,
          });

          done();
        },
      });
    });

    it('should throw INTERNAL error if updating the user fails', (done) => {
      entityManagerMock.update.mockRejectedValue(
        new RpcException({
          code: status.INTERNAL,
          message: 'Failed to update user',
        }),
      );

      service.update(updateUserDto).subscribe({
        next: () => {
          done.fail('Expected an error to be thrown');
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a user by ID', (done) => {
      entityManagerMock.delete.mockResolvedValue({ affected: 1 });

      service.delete({ id }).subscribe({
        next: (result) => {
          expect(result).toEqual({
            deleted: true,
            message: 'User with id 1 deleted successfully',
          });
          done();
        },
        error: () => {
          done.fail('Expected user to be removed successfully');
        },
      });
    });

    it('should throw NOT_FOUND error if user to delete does not exist', (done) => {
      entityManagerMock.delete.mockResolvedValue({ affected: 0 });

      service.delete({ id }).subscribe({
        next: () => {
          done.fail('Expected NOT_FOUND error to be thrown');
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.NOT_FOUND,
          });

          done();
        },
      });
    });

    it('should throw an INTERNAL error if removing the user fails', (done) => {
      entityManagerMock.delete.mockRejectedValue(
        new RpcException({
          code: status.INTERNAL,
          message: 'Failed to delete user',
        }),
      );

      service.delete({ id }).subscribe({
        next: () => {
          done.fail('Expected an error to be thrown');
        },
        error: (error: RpcException) => {
          expect(error).toBeInstanceOf(RpcException);
          expect(error.getError()).toMatchObject({
            code: status.INTERNAL,
          });

          done();
        },
      });
    });
  });
});
