import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IJwtPayload } from '@app/common';
export const CurrentUser = createParamDecorator(
  (data: keyof IJwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as IJwtPayload;
    return data ? user?.[data] : user;
  },
);
