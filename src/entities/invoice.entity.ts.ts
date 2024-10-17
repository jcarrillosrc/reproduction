import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";
import { Author } from "./author.entity";
import { Order } from "./order.entity";
import { IdentityType, MikroormIdentityType } from "./identity.type";

@Entity({ tableName: "test_invoice" })
export class Invoice {
  @PrimaryKey({
    type: new MikroormIdentityType<IdentityType>(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @ManyToOne<Invoice, Order>({
    entity: () => Order,
    inversedBy: (order) => order.invoices,
  })
  order: Order;

  @ManyToOne<Invoice, Author>({
    entity: () => Author,
    inversedBy: (author) => author.invoices,
  })
  author: Author;

  @Property()
  createdAt: Date;

  constructor(id: IdentityType, order: Order, author: Author) {
    this.id = id;
    this.order = order;
    this.author = author;

    this.createdAt = new Date();
  }
}
