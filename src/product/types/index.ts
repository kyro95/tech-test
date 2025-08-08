import { Observable } from 'rxjs';

interface CreateProductRequest {
  name: string;
  price: number;
}

interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number;
}

interface ProductResponse {
  id: number;
  name: string;
  price: number;
}

interface ProductServiceClient {
  createProduct(data: CreateProductRequest): Observable<ProductResponse>;
  getProduct(data: { id: number }): Observable<ProductResponse>;
  updateProduct(data: UpdateProductRequest): Observable<ProductResponse>;
  listProductsByOrderId(data: {
    id: number;
  }): Observable<{ products: ProductResponse[] }>;
  deleteProduct(data: {
    id: number;
  }): Observable<{ deleted: boolean; message: string }>;
  listProducts(data: unknown): Observable<{ products: ProductResponse[] }>;
}

export type {
  CreateProductRequest,
  ProductResponse,
  ProductServiceClient,
  UpdateProductRequest,
};
