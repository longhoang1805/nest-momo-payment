import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

@Table({ tableName: 'orders' })
export class Order extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number;

  @Column({ type: DataType.DECIMAL(12, 2), allowNull: false })
  totalAmount: number;

  @Column({
    type: DataType.ENUM(...Object.values(OrderStatus)),
    defaultValue: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: DataType.STRING, allowNull: false })
  firstName: string;

  @Column({ type: DataType.STRING, allowNull: false })
  lastName: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  address: string;

  @Column({ type: DataType.STRING })
  momoOrderId: string;

  @Column({ type: DataType.STRING })
  momoRequestId: string;

  @Column({ type: DataType.TEXT })
  momoPayUrl: string;

  @Column({ type: DataType.TEXT })
  momoQrCodeUrl: string;

  @Column({ type: DataType.STRING })
  zaloPayTransId: string;

  @Column({ type: DataType.TEXT })
  zaloPayOrderUrl: string;

  @Column({ type: DataType.TEXT })
  zaloPayQrCode: string;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => OrderItem)
  items: OrderItem[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
