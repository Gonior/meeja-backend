import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { ClsServiceManager } from 'nestjs-cls';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const cls = ClsServiceManager.getClsService();
    const requestId = cls?.get('requestId');
    const userId = cls?.get('userId');
    // const lang = (request.headers['accept-language'] as Lang) || 'en';
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: { message: string; error: string | object | null | unknown } = {
      message: 'Internal server error',
      error: null,
    };
    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const res: any = exception.getResponse();
      console.log({ res });
      body = {
        message: res.message,
        error: res.error,
      };

      if (status === 413) {
        // get error from multer middleware
        const maxSize = request['multerMaxSize'] / 1024 / 1024;
        body = {
          message: `File too large, max ${maxSize}MB `,
          error: null,
        };
      }
    } else if (exception instanceof Error) {
      body = {
        message: exception.message,
        error: exception?.cause || null,
      };
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      ...body,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
      userId,
    });
  }
}
