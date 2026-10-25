import { Injectable } from "@nestjs/common";
import { newPrefixedId } from "@zedtech/zedkit-core";

export interface Item {
  id: string;
  name: string;
  quantity: number;
}

@Injectable()
export class ItemsService {
  private readonly items: Item[] = [];

  create(name: string, quantity: number): Item {
    const item = { id: newPrefixedId("item"), name, quantity };
    this.items.push(item);
    return item;
  }

  list(): Item[] {
    return [...this.items];
  }
}
