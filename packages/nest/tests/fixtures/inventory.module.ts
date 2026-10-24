import "reflect-metadata";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Injectable,
  Module,
  Post,
  Req,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { createHash } from "node:crypto";

/**
 * Generic fixture domain ("inventory") for the bootstrap tests. Deliberately
 * product-free: it exercises validation, raw bodies, errors, and docs
 * without any product-specific concept. Standard implicit injection
 * throughout: vitest transforms via SWC (see vitest.config.ts), which
 * emits the same decorator metadata `tsc` does for builds.
 */

export class CreateItemDto {
  @ApiProperty({ example: "widget" })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  quantity!: number;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
}

@Injectable()
export class InventoryService {
  private readonly items: Item[] = [];
  private nextId = 1;

  create(name: string, quantity: number): Item {
    const item = { id: `item_${this.nextId++}`, name, quantity };
    this.items.push(item);
    return item;
  }

  list(): Item[] {
    return [...this.items];
  }
}

@Controller("items")
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  list(): Item[] {
    return this.inventory.list();
  }

  @Post()
  create(@Body() dto: CreateItemDto): Item {
    return this.inventory.create(dto.name, dto.quantity);
  }

  @Get("boom")
  explode(): never {
    throw new Error("kaboom");
  }
}

@Controller("echo-raw")
export class RawEchoController {
  @Post()
  @HttpCode(200)
  echo(@Req() req: RawBodyRequest<{ url?: string }>): {
    sha256: string;
    bytes: number;
  } {
    const raw = req.rawBody ?? Buffer.of();
    return {
      sha256: createHash("sha256").update(raw).digest("hex"),
      bytes: raw.length,
    };
  }
}

@Module({
  controllers: [InventoryController, RawEchoController],
  providers: [InventoryService],
})
export class InventoryModule {}

/** Fixture env schema proving validated, typed, defaulted env access. */
export class FixtureEnv {
  @IsString()
  @MinLength(1)
  FIXTURE_TOKEN!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  FIXTURE_PORT: number = 3101;
}
