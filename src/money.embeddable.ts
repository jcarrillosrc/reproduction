import { DecimalType, Embeddable, Property } from "@mikro-orm/core";

@Embeddable()
export class Money {
  @Property({
    type: new DecimalType("number"),
    scale: 2,
  })
  amount: number;

  @Property({ length: 3 })
  currencyCode: string;

  constructor(amount: number, currencyCode: string) {
    this.amount = amount;
    this.currencyCode = currencyCode;
  }
}
