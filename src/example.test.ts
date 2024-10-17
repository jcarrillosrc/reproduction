import { Entity, MikroORM, PrimaryKey, Property } from "@mikro-orm/sqlite";

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}

let orm: MikroORM;
let loggerMessages: string[] = [];

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ":memory:",
    entities: [User],
    debug: ["query", "query-params"],
    allowGlobalContext: true, // only for testing
    logger: (message: string) => {
      loggerMessages.push(message);
    },
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("should use logger context label on all transaction operation logs", async () => {
  await orm.em.transactional(
    async (em) => {
      em.create(User, { name: "Foo", email: "foo" });
    },
    {
      loggerContext: {
        label: "logger-context-label",
      },
    }
  );

  await orm.em.transactional(
    async (em) => {
      await em.find(User, { email: "foo" });
    },
    {
      loggerContext: {
        label: "logger-context-label",
      },
    }
  );

  const logMessagesWithLoggerContextLabel = loggerMessages.filter(
    (message: string) => {
      return (
        /([query](.+)(logger-context-label)(.+)(insert into `user`))/gi.test(
          message
        ) ||
        /([query](.+)(logger-context-label)(.+)(commit))/gi.test(message) ||
        /([query](.+)(logger-context-label)(.+)(begin))/gi.test(message)
      );
    }
  );

  console.log(loggerMessages);

  expect(logMessagesWithLoggerContextLabel.length).toBeGreaterThan(0);
});
