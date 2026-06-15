import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

import { apiSuccess, isApiResponse } from "../api-response";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value: unknown) => {
        if (isApiResponse(value)) {
          return value;
        }

        return apiSuccess("OK", value ?? null);
      }),
    );
  }
}
