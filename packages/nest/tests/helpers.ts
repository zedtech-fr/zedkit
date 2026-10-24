import "reflect-metadata";
import type { INestApplication } from "@nestjs/common";
import { afterEach } from "vitest";
import { Writable } from "node:stream";
import {
  createNestApp,
  type NestBootstrapOptions,
} from "../src/index.js";
import { InventoryModule } from "./fixtures/inventory.module.js";

const apps: INestApplication[] = [];
afterEach(async () => {
  while (apps.length > 0) {
    const app = apps.pop();
    if (app) await app.close();
  }
});

export async function boot(
  options?: Partial<NestBootstrapOptions>,
): Promise<{ app: INestApplication; url: string }> {
  const app = await createNestApp({
    module: InventoryModule,
    logger: { level: "silent" },
    ...options,
  });
  apps.push(app);
  await app.listen(0, "127.0.0.1");
  const url = await app.getUrl();
  return { app, url };
}

/** In-memory pino destination for asserting on request logs. */
export function captureStream(): { stream: Writable; text: () => string } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(
      chunk: string,
      encoding: BufferEncoding,
      callback: (error?: Error | null) => void,
    ): void {
      chunks.push(Buffer.from(chunk, encoding).toString("utf8"));
      callback();
    },
  });
  return { stream, text: () => chunks.join("") };
}

/** pino writes async: poll briefly for a line, then assert. */
export async function waitForLogs(
  text: () => string,
  needle: string,
): Promise<string> {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline && !text().includes(needle)) {
    await new Promise((r) => setTimeout(r, 25));
  }
  return text();
}
