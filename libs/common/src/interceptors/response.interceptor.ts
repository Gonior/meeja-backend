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
  // constructor(private _env: EnvService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse() as Response;
    const cls = ClsServiceManager.getClsService();
    const requestId = cls?.get('requestId');
    const userId = cls?.get('userId');
    return next.handle().pipe(
      map((response: unknown) => {
        let message = 'Request successfully';
        let data: null | object | string | unknown = null;
        // how to use setCookies :
        // di controller tinggal return {clearCookies:['namaCookie']}
        if (response instanceof StreamableFile) {
          return response;
        }

        // clean response
        if (typeof response === 'object' && response !== null) {
          // how to use clearCookies
          // di controller tinggal return {clearCookies:['namaCookie']}
          if ('clearCookies' in response && Array.isArray(response?.clearCookies)) {
            for (const cookieName of response.clearCookies) {
              res.clearCookie(cookieName);
            }
            delete response.clearCookies;
          }
          // how to use setCookies
          // di controller tinggal return {setCookies:[{name : 'nama_cookie', value : 'value_cookie', options : {maxAge:1000}}]}
          if ('setCookies' in response && Array.isArray(response.setCookies)) {
            for (const { name, value, options } of response.setCookies) {
              res.cookie(name, value, {
                httpOnly: true,
                sameSite: 'lax',
                secure: false, // this._env.isProduction
                ...options,
              });
            }
            delete response.setCookies;
          }

          // biar message nya ga double-double
          if (
            'message' in response &&
            typeof response.message === 'string' &&
            response.message !== undefined
          ) {
            message = response.message;
            delete response.message;
          }
        }

        if (response !== undefined && response !== null && typeof response === 'object') {
          if ('data' in response) data = response.data;
          else data = response;
        }

        return {
          success: true,
          statusCode: res.statusCode,
          message,
          data,
          timestamp: new Date().toISOString(),
          path: req.url,
          requestId,
          userId,
        };
      }),
    );
  }
}
