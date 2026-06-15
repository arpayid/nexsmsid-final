export type ApiResponse<TData = unknown, TMeta = unknown> = {
  success: boolean;
  message: string;
  data: TData;
  meta?: TMeta;
};

export function apiSuccess<TData, TMeta = unknown>(message: string, data: TData, meta?: TMeta): ApiResponse<TData, TMeta> {
  return {
    success: true,
    message,
    data,
    ...(meta === undefined ? {} : { meta }),
  };
}

export function isApiResponse(value: unknown): value is ApiResponse {
  return Boolean(value && typeof value === "object" && "success" in value && "message" in value && "data" in value);
}
