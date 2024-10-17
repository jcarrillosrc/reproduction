import { MikroORM } from "@mikro-orm/core";
import { defineConfig } from "@mikro-orm/postgresql";
import { Buyer } from "./entities/buyer.entity";
import { Book } from "./entities/book.entity";
import { Order } from "./entities/order.entity";
import { Author, Metrics } from "./entities/author.entity";
import { Invoice } from "./entities/invoice.entity.ts";
import { IdentityType } from "./entities/identity.type";

describe("should not update entities just for find them inside a transaction", () => {
  let orm: MikroORM;
  let loggerMessages: string[] = [];

  beforeAll(async () => {
    orm = await MikroORM.init(
      defineConfig({
        clientUrl: "postgresql://admin:admin@localhost:5432/admin_api",
        entities: [Buyer, Book, Order, Author, Invoice],
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

      author_user_1.orders.add(order);
      author_user_1.invoices.add(invoice);

      buyer_user_2.orders.add(order);

      book.orders.add(order);
      order.invoices.add(invoice);

      em.persist(invoice);
    });

    orm.em.clear();

    await orm.em.fork().transactional(async () => {
      await orm.em.getRepository(Invoice).findOne(invoiceId, {
        disableIdentityMap: false,
        populate: ["order", "author"],
      });
    });

    const unwantedUpdate = loggerMessages.find((message: string) => {
      return /(update)/gi.test(message);
    });

    console.log(loggerMessages);

    expect(unwantedUpdate).toBeFalsy();
  });
});
