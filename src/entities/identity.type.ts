import {
  EntityProperty,
  Platform,
  Type,
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
