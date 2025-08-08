import { Observable } from 'rxjs';

interface CreateUserRequest {
  name: string;
  email: string;
}

interface CreateUserResponse {
  id: number;
  name: string;
  email: string;
}

interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: number;
}

interface DeleteUserResponse {
  deleted: boolean;
  message: string;
}

interface UserServiceClient {
  createUser(data: CreateUserRequest): Observable<CreateUserResponse>;
  deleteUser(data: { id: number }): Observable<DeleteUserResponse>;
  getUser(data: { id: number }): Observable<CreateUserResponse>;
  updateUser(data: UpdateUserRequest): Observable<CreateUserResponse>;
  listUsers(data: unknown): Observable<{ users: CreateUserResponse[] }>;
}

export type {
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  DeleteUserResponse,
  UserServiceClient,
};
