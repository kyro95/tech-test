import { Controller } from '@nestjs/common';
import { ProductService } from './product.service';
import { GrpcMethod } from '@nestjs/microservices';
import CreateProductDto from './dto/create-product.dto';
import DeleteProductDto from './dto/delete-product.dto';
import GetProductDto from './dto/get-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @GrpcMethod('ProductService', 'GetProduct')
  public findOne(getProductDto: GetProductDto) {
    return this.productService.findOne(getProductDto);
  }

  @GrpcMethod('ProductService', 'ListProducts')
  public findAll() {
    return this.productService.findAll();
  }

  @GrpcMethod('ProductService', 'ListProductsByOrderId')
  public findByOrderId(getProductDto: GetProductDto) {
    return this.productService.findByOrderId(getProductDto);
  }

  @GrpcMethod('ProductService', 'CreateProduct')
  public create(createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @GrpcMethod('ProductService', 'UpdateProduct')
  public update(updateProductDto: UpdateProductDto) {
    return this.productService.update(updateProductDto);
  }

  @GrpcMethod('ProductService', 'DeleteProduct')
  public delete(deleteProductDto: DeleteProductDto) {
    return this.productService.delete(deleteProductDto);
  }
}
