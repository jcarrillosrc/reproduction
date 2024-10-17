import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from "@mikro-orm/sqlite";
import {
  Type,
  Platform,
  EntityProperty,
  ValidationError,
} from "@mikro-orm/core";
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
    if (value instanceof IdentityType) {
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

@Entity({ tableName: "test_user" })
class User {
  @PrimaryKey({
    type: new MikroormIdentityType<IdentityType>(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @Property()
  name: string;

  @OneToMany<Book, User>({
    entity: () => Book,
    mappedBy: (book) => book.user,
    orderBy: {
      id: "ASC",
    },
  })
  books = new Collection<Book, this>(this);

  constructor(id: IdentityType, name: string) {
    this.id = id;
    this.name = name;
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

  @ManyToOne<Book, User>({
    entity: () => User,
    inversedBy: (user) => user.books,
  })
  user: User;

  @OneToMany<BookNote, Book>({
    entity: () => BookNote,
    mappedBy: (note) => note.book,
    orderBy: {
      id: "ASC",
    },
  })
  notes = new Collection<BookNote, this>(this);

  constructor(id: IdentityType, name: string, user: User) {
    this.id = id;
    this.name = name;
    this.user = user;
  }
}

@Entity({ tableName: "test_books_tags" })
class BookNote {
  @PrimaryKey({
    type: new MikroormIdentityType<IdentityType>(IdentityType),
  })
  id: IdentityType = new IdentityType();

  @Property()
  name: string;

  @ManyToOne<BookNote, Book>({
    entity: () => Book,
    inversedBy: (book) => book.notes,
  })
  book: Book;

  constructor(id: IdentityType, name: string, book: Book) {
    this.id = id;
    this.name = name;
    this.book = book;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ":memory:",
    entities: [User, Book, BookNote],
    debug: false,
    allowGlobalContext: true, // only for testing
    forceEntityConstructor: true,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("should don't throw error on custom type", async () => {
  const userId = new IdentityType();
  const bookId = new IdentityType();
  const bookNoteId01 = new IdentityType();
  const bookNoteId02 = new IdentityType();

  await orm.em.transactional(async () => {
    const user = orm.em.create(User, {
      id: userId,
      name: "Foo",
    });
    const book = new Book(bookId, "book-1", user);

    book.notes.add(new BookNote(bookNoteId01, "tag_01", book));
    book.notes.add(new BookNote(bookNoteId02, "tag_02", book));

    user.books.add(book);
  });

  orm.em.clear();

  await orm.em.transactional(async () => {
    await orm.em.findOne(
      Book,
      {
        id: bookId,
      },
      {
        populate: ["user", "notes"],
      }
    );
  });
});
