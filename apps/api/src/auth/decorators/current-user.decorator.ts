import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { AuthenticatedUser, RequestWithUser } from "../auth.types";

export const CurrentUser = createParamDecorator<keyof AuthenticatedUser | undefined>((data, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();

  if (!data) {
    return request.user;
  }

  return request.user?.[data];
});
