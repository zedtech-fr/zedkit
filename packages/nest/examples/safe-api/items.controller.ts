import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateItemDto } from "./create-item.dto.js";
import { ItemsService } from "./items.service.js";

@Controller("items")
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  list() {
    return this.items.list();
  }

  @Post()
  create(@Body() dto: CreateItemDto) {
    return this.items.create(dto.name, dto.quantity);
  }
}
