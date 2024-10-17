import {
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/core";
import { Author } from "./author.entity";
import { IdentityType, MikroormIdentityType } from "./identity.type";
import { Order } from "./order.entity";

@Entity({ tableName: "test_books" })
export class Book {
  @PrimaryKey({
    type: new MikroormIdentityType<IdentityType>(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @Property()
  name: string;

  @ManyToOne<Book, Author>({
    entity: () => Author,
    inversedBy: (author) => author.books,
  })
  author: Author;

  @OneToMany<Order, Book>({
    entity: () => Order,
    mappedBy: (order) => order.book,
    orderBy: {
      id: "ASC",
    },
  })
  orders = new Collection<Order, this>(this);

  @Property()
  createdAt: Date;

  constructor(id: IdentityType, name: string, author: Author) {
    this.id = id;
    this.name = name;
    this.author = author;

    this.createdAt = new Date();
  }
}
