import { CallHandler, ExecutionContext, HttpException, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";

type RequestLike = {
  method: string;
  originalUrl?: string;
  url: string;
};

type ResponseLike = {
  statusCode: number;
};

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const response = context.switchToHttp().getResponse<ResponseLike>();
    const startedAt = Date.now();
    const path = request.originalUrl ?? request.url;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`${request.method} ${path} ${response.statusCode} ${Date.now() - startedAt}ms`);
        },
        error: (error: unknown) => {
          const status = error instanceof HttpException ? error.getStatus() : 500;
          this.logger.warn(`${request.method} ${path} ${status} ${Date.now() - startedAt}ms`);
        },
      }),
    );
  }
}
