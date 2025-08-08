import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderStatus } from './types';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @ManyToMany(() => Product, (product) => product.orders)
  @JoinTable()
  products: Product[];

  @Column({ type: 'decimal' })
  totalAmount: number;

  @Column({ type: 'int', default: OrderStatus.CREATED })
  status: OrderStatus;
}
