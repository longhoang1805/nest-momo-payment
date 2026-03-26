import { Column, CreatedAt, DataType, Model, Table, UpdatedAt } from 'sequelize-typescript';

export enum AdminRole {
  SUPERADMIN = 'superAdmin',
  ADMIN = 'admin',
}

@Table({ tableName: 'admins' })
export class Admin extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  password: string;

  @Column({
    type: DataType.ENUM(...Object.values(AdminRole)),
    allowNull: false,
    defaultValue: AdminRole.ADMIN,
  })
  role: AdminRole;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
