import { randomUUID } from "node:crypto";

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";

import { ApiResponse } from "../../common/api-response";

type HttpResponse = {
  status: (statusCode: number) => {
    json: (body: ApiResponse) => void;
  };
};

type HttpRequest = {
  method: string;
  url: string;
};

const PRISMA_USER_ERRORS: Record<string, { status: number; message: string }> = {
  P2002: { status: HttpStatus.CONFLICT, message: "Resource already exists (unique constraint violation)" },
  P2025: { status: HttpStatus.NOT_FOUND, message: "Resource not found" },
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly configService?: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpResponse>();
    const request = ctx.getRequest<HttpRequest>();
    const requestId = randomUUID().slice(0, 8).toUpperCase();

    const prismaError = this.resolvePrismaError(exception);
    const status = prismaError?.status ?? (exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR);
    const message = prismaError?.message ?? this.getSafeMessage(exception, status);

    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.url} ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${requestId}] ${request.method} ${request.url} ${status} — ${message}`);
    }

    response.status(status).json({
      success: false,
      message,
      data: {
        method: request.method,
        path: request.url,
        statusCode: status,
        timestamp: new Date().toISOString(),
        ...(this.isDev() ? { requestId } : {}),
      },
    });
  }

  private resolvePrismaError(exception: unknown): { status: number; message: string } | null {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapping = PRISMA_USER_ERRORS[exception.code];
      if (mapping) {
        const fields = (exception.meta as Record<string, unknown>)?.["target"];
        const detail = Array.isArray(fields) ? ` (${fields.join(", ")})` : "";
        return { status: mapping.status, message: `${mapping.message}${detail}` };
      }

      return { status: HttpStatus.BAD_REQUEST, message: "Database request failed" };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid request data",
      };
    }

    return null;
  }

  private getSafeMessage(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === "string") {
        return response;
      }

      if (response && typeof response === "object" && "message" in response) {
        const message = (response as { message: string | string[] }).message;
        return Array.isArray(message) ? message.join(", ") : message;
      }

      return exception.message;
    }

    if (this.isDev() && exception instanceof Error && exception.message) {
      return exception.message;
    }

    return "Internal server error";
  }

  private isDev(): boolean {
    const env = this.configService?.get<string>("NODE_ENV");
    return env !== "production";
  }
}
