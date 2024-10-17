import {
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { IdentityType, MikroormIdentityType } from "./identity.type";
import { Order } from "./order.entity";

@Entity({ tableName: "test_buyer" })
export class Buyer {
  @PrimaryKey({
    type: new MikroormIdentityType<IdentityType>(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @Property()
  name: string;

  @OneToMany<Order, Buyer>({
    entity: () => Order,
    mappedBy: (order) => order.buyer,
    orderBy: {
      id: "ASC",
    },
  })
  orders = new Collection<Order, this>(this);

  @Property()
  createdAt: Date;

  constructor(id: IdentityType, name: string) {
    this.id = id;
    this.name = name;

    this.createdAt = new Date();
  }
}
