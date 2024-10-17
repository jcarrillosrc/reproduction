import {
  Collection,
  Embeddable,
  Embedded,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Book } from "./book.entity";
import { Order } from "./order.entity";
import { Buyer } from "./buyer.entity";
import { Invoice } from "./invoice.entity.ts";
import { IdentityType, MikroormIdentityType } from "./identity.type";

@Embeddable()
export class Metrics {
  @Property()
  metric_01: number;

  @Property()
  metric_02: number;

  constructor(metric_01: number, metric_02: number) {
    this.metric_01 = metric_01;
    this.metric_02 = metric_02;
  }
}

@Entity({ tableName: "test_author" })
export class Author {
  @PrimaryKey({
    type: new MikroormIdentityType<IdentityType>(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @Property()
  name: string;

  @Property()
  createdAt: Date;

  @Embedded(() => Metrics)
  metrics: Metrics;

  @OneToMany<Book, Author>({
    entity: () => Book,
    mappedBy: (book) => book.author,
    orderBy: {
      id: "ASC",
    },
  })
  books = new Collection<Book, this>(this);

  @OneToMany<Order, Buyer>({
    entity: () => Order,
    mappedBy: (order) => order.author,
    orderBy: {
      id: "ASC",
    },
  })
  orders = new Collection<Order, this>(this);

  @OneToMany<Invoice, Author>({
    entity: () => Invoice,
    mappedBy: (invoice) => invoice.author,
    orderBy: {
      id: "ASC",
    },
  })
  invoices = new Collection<Invoice, this>(this);

  constructor(id: IdentityType, name: string, metrics: Metrics) {
    this.id = id;
    this.name = name;
    this.metrics = metrics;

    this.createdAt = new Date();
  }
}
