import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { REQUEST_USER_KEY } from '../iam.constant';
import { ActiveUserData } from '../interfaces';

export const ActiveUser = createParamDecorator(
  (property: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user: ActiveUserData | undefined = request[REQUEST_USER_KEY];

    return property ? user?.[property] : user;
  },
);
