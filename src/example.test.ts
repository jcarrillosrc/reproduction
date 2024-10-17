import {
  Collection,
  defineConfig,
  Embeddable,
  Embedded,
  Entity,
  EntityProperty,
  ManyToOne,
  MikroORM,
  OneToMany,
  Platform,
  PrimaryKey,
  Property,
  Type,
  ValidationError,
} from "@mikro-orm/postgresql";
import { uuidv7 } from "uuidv7";

export class IdentityType extends String {
  constructor(id = uuidv7()) {
    super(id);
  }

  public isEqual(to: IdentityType) {
    return this.valueOf() === to.valueOf();
  }
}

export class MikroormIdentityType<SubType> extends Type<IdentityType, string> {
  private className;

  constructor(className: new (value: string) => SubType) {
    super();
    this.className = className;
  }

  convertToDatabaseValue(value: IdentityType | string): string {
    if (typeof value === "object") {
      if (!(value instanceof IdentityType)) {
        throw ValidationError.invalidType(MikroormIdentityType, value, "JS");
      }
      return value.toString();
    } else if (typeof value === "string" && value) {
      return value;
    }

    throw ValidationError.invalidType(MikroormIdentityType, value, "JS");
  }

  compareValues(a: IdentityType | string, b: IdentityType | string): boolean {
    return a.valueOf() === b.valueOf();
  }

  convertToJSValue(value: IdentityType | string | undefined): IdentityType {
    if (!value || value instanceof IdentityType) {
      return value as IdentityType;
    }

    return new this.className(value) as IdentityType;
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getUuidTypeDeclarationSQL({
      length: 36,
    });
  }
}

@Embeddable()
class Metrics {
  @Property()
  metric_01: number;

  @Property()
  metric_02: number;

  constructor(metric_01: number, metric_02: number) {
    this.metric_01 = metric_01;
    this.metric_02 = metric_02;
  }
}

@Entity({ tableName: "test_buyer" })
class Buyer {
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

  constructor(id: IdentityType, name: string) {
    this.id = id;
    this.name = name;
  }
}

@Entity({ tableName: "test_author" })
class Author {
  @PrimaryKey({
    type: new MikroormIdentityType<IdentityType>(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @Property()
  name: string;

  @Property()
  createdAt: Date = new Date();

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
  }
}

@Entity({ tableName: "test_books" })
class Book {
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

  constructor(id: IdentityType, name: string, author: Author) {
    this.id = id;
    this.name = name;
    this.author = author;
  }
}

@Entity({ tableName: "test_orders" })
class Order {
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

  constructor(id: IdentityType, book: Book, buyer: Buyer, author: Author) {
    this.id = id;
    this.book = book;
    this.buyer = buyer;
    this.author = author;
  }
}

@Entity({ tableName: "test_invoice" })
class Invoice {
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

  constructor(id: IdentityType, order: Order, author: Author) {
    this.id = id;
    this.order = order;
    this.author = author;
  }
}

describe("should not update entities just for find them inside a transaction", () => {
  let orm: MikroORM;
  let loggerMessages: string[] = [];

  beforeAll(async () => {
    orm = await MikroORM.init(
      defineConfig({
        clientUrl: "postgresql://admin:admin@localhost:5432/admin_api",
        entities: [Buyer, Book, Order],
        debug: ["query", "query-params"],
        allowGlobalContext: true, // only for testing
        forceEntityConstructor: true,
        logger: (message: string) => {
          loggerMessages.push(message);
        },
      })
    );
    await orm.schema.refreshDatabase();
  });

  beforeEach(() => {
    loggerMessages = [];
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test("should not update book entity when findOne a user WITHOUT books", async () => {
    const userId_1 = new IdentityType();
    const userId_2 = new IdentityType();
    const bookId = new IdentityType();
    const orderId = new IdentityType();
    const invoiceId = new IdentityType();

    await orm.em.fork().transactional(async (em) => {
      const author_user_1 = new Author(userId_1, "author_1", new Metrics(1, 2));
      const buyer_user_2 = new Buyer(userId_2, "buyer_1");
      const book = new Book(bookId, "book_1", author_user_1);
      const order = new Order(orderId, book, buyer_user_2, author_user_1);
      const invoice = new Invoice(invoiceId, order, author_user_1);
      em.persist(invoice);
    });

    orm.em.clear();

    await orm.em.fork().transactional(async () => {
      const found = await orm.em.getRepository(Invoice).findOne(invoiceId, {
        disableIdentityMap: false,
        populate: ["order", "author"],
      });

      console.log("---> ", found?.order.author);
      console.log(found);
    });

    const unwantedUpdate = loggerMessages.find((message: string) => {
      return /(update)/gi.test(message);
    });

    console.log(loggerMessages);

    expect(unwantedUpdate).toBeFalsy();
  });
});
