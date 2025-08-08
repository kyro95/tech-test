import { Observable } from 'rxjs';
import { User } from '../../user/user.entity';
import { ProductResponse } from '../../product/types';

enum OrderStatus {
  CREATED = 0,
  PAID = 1,
  SHIPPED = 2,
  DELIVERED = 3,
  CANCELLED = 4,
  REFUNDED = 5,
  LOST = 6,
}

interface CreateOrderRequest {
  userId: number;
  productIds: number[];
}

interface GetOrderRequest {
  id: number;
}

interface GetOrderResponse {
  id: number;
  totalAmount: number;
  status: OrderStatus;
  user: User;
  products: ProductResponse[];
}

interface ListOrdersResponse {
  orders: GetOrderResponse[];
}

interface DeleteOrderRequest {
  id: number;
}

interface DeleteOrderResponse {
  deleted: boolean;
  message: string;
}

interface UpdateOrderRequest {
  id: number;
  userId: number;
  productIds: number[];
  status?: number;
}

interface GetOrderByUserIdRequest {
  id: number;
}

interface OrderServiceClient {
  createOrder(data: CreateOrderRequest): Observable<GetOrderResponse>;
  getOrder(data: GetOrderRequest): Observable<GetOrderResponse>;
  listOrdersByUserId(
    data: GetOrderByUserIdRequest,
  ): Observable<ListOrdersResponse>;
  listOrders(data: unknown): Observable<ListOrdersResponse>;
  deleteOrder(data: DeleteOrderRequest): Observable<DeleteOrderResponse>;
  updateOrder(data: UpdateOrderRequest): Observable<GetOrderResponse>;
}

export { OrderStatus };

export type {
  CreateOrderRequest,
  GetOrderRequest,
  GetOrderResponse,
  ListOrdersResponse,
  DeleteOrderRequest,
  DeleteOrderResponse,
  UpdateOrderRequest,
  GetOrderByUserIdRequest,
  OrderServiceClient,
};
