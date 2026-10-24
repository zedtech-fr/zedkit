// Original work by the same author.
import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { REQUEST_ID_HEADER } from "./request-id.js";

/**
 * Echoes the request id as a response header on every handled route.
 * Set before the handler runs, so it survives handler errors; errors
 * thrown earlier (guards, parsers, unknown routes) get the same
 * header from the error filter instead.
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): ReturnType<CallHandler["handle"]> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<FastifyRequest>();
    const reply = ctx.getResponse<FastifyReply>();
    if (typeof req.id === "string" && req.id.length > 0) {
      reply.header(REQUEST_ID_HEADER, req.id);
    }
    return next.handle();
  }
}
