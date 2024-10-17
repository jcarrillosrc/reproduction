import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Buyer } from "./buyer.entity";
import { Author } from "./author.entity";
import { IdentityType, MikroormIdentityType } from "./identity.type";
import { Book } from "./book.entity";
import { Invoice } from "./invoice.entity.ts";

@Entity({ tableName: "test_orders" })
export class Order {
  @PrimaryKey({
    type: new MikroormIdentityType<IdentityType>(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @ManyToOne<Order, Book>(() => Book, {
    joinColumn: "book_id",
    inversedBy: (book) => book.orders,
  })
  book: Book;

  @ManyToOne<Order, Buyer>(() => Buyer, {
    joinColumn: "buyer_id",
    inversedBy: (user) => user.orders,
  })
  buyer: Buyer;

  @ManyToOne<Order, Author>(() => Author, {
    joinColumn: "author_id",
    inversedBy: (user) => user.orders,
  })
  author: Author;

  @OneToMany<Invoice, Order>({
    entity: () => Invoice,
    mappedBy: (invoice) => invoice.order,
  })
  invoices = new Collection<Invoice, this>(this);

  @Property()
  createdAt: Date;

  constructor(id: IdentityType, book: Book, buyer: Buyer, author: Author) {
    this.id = id;
    this.book = book;
    this.buyer = buyer;
    this.author = author;

    this.createdAt = new Date();
  }
}
