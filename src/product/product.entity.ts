import { Order } from '../order/order.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: false })
  name: string;

  @Column()
  price: number;

  @ManyToMany(() => Order, (order) => order.products)
  orders?: Order[];
}
