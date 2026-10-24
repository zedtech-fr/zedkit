// Original work by the same author.
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Global error shape for every Nest app from this bootstrap:
 * `{ code, message, requestId }` with the matching HTTP status.
 * 4xx responses carry the safe client-facing message; 5xx responses never
 * leak internals (the full error goes to the logger only).
 */
export interface ErrorBody {
  code: string;
  message: string;
  requestId: string;
}

const STATUS_CODES: Record<number, string> = {
  400: "invalid_input",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  413: "payload_too_large",
  429: "rate_limited",
  500: "internal",
  503: "unavailable",
};

/** Safe public messages for mapped 5xx; everything else stays "internal error". */
const STATUS_5XX_MESSAGES: Record<number, string> = {
  503: "service unavailable",
};

function fastifyBodyErrorStatus(exception: unknown): number | null {
  if (typeof exception !== "object" || exception === null) return null;
  if (!("code" in exception) || typeof exception.code !== "string") return null;
  if (exception.code === "FST_ERR_CTP_BODY_TOO_LARGE") return 413;
  if (exception.code.startsWith("FST_ERR_CTP_")) return 400;
  return null;
}

function httpMessage(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === "string") return response;
  if (typeof response === "object" && response !== null && "message" in response) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.map(String).join("; ");
  }
  return exception.message;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();
    const requestId = typeof req.id === "string" ? req.id : "unknown";

    let status: number;
    let message: string;
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message =
        status >= 500
          ? (STATUS_5XX_MESSAGES[status] ?? "internal error")
          : httpMessage(exception);
    } else {
      const bodyStatus = fastifyBodyErrorStatus(exception);
      status = bodyStatus ?? 500;
      message =
        status === 413
          ? "body exceeds the configured limit"
          : status === 400
            ? "invalid request body"
            : "internal error";
    }
    if (status >= 500) {
      this.logger.error(
        `Unhandled error on ${req.method} ${req.url}: ${String(exception)}`,
      );
    }
    const code = STATUS_CODES[status] ?? `http_${status}`;
    reply.status(status).send({ code, message, requestId } satisfies ErrorBody);
  }
}
