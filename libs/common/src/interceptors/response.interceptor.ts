import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ClsServiceManager } from 'nestjs-cls';
import { map, Observable } from 'rxjs';
import { EnvService } from '@app/common';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  constructor(private env: EnvService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse() as Response;
    const cls = ClsServiceManager.getClsService();
    const requestId = cls?.get('requestId');
    const userId = cls?.get('userId');
    return next.handle().pipe(
      map((response: any) => {
        let message = 'Request successfully';
        // how to use setCookies :
        // di controller tinggal return {clearCookies:['namaCookie']}
        if (response instanceof StreamableFile) {
          return response;
        }
        if (Array.isArray(response?.clearCookies)) {
          for (const cookieName of response.clearCookies) {
            res.clearCookie(cookieName);
          }
        }
        // how to use clearCookies
        // di controller tinggal return {setCookies:[{name : 'nama_cookie', value : 'value_cookie', options : {maxAge:1000}}]}
        if (Array.isArray(response?.setCookies)) {
          for (const { name, value, options } of response.setCookies) {
            res.cookie(name, value, {
              httpOnly: true,
              sameSite: 'lax',
              secure: false, // this.env.isProduction
              ...options,
            });
          }
        }

        // biar message nya ga double-double
        if (response && (response.messagge || response.message !== undefined)) {
          message = response.message;
          delete response.message;
        }

        const isPaginated =
          response && response.data && Array.isArray(response.data) && response.meta;
        return {
          success: true,
          message,
          data: response?.data ?? response,
          ...(response?.meta && { meta: response.meta }),
          timestamp: new Date().toISOString(),
          path: req.url,
          requestId,
          userId,
        };
      }),
    );
  }
}
