import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { CommonModule, EnvService } from '@app/common';
import { DrizzleModule } from '@app/drizzle';
import { RedisModule } from '@app/redis';
import { ClsModule, ClsService } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import { randomBytes } from 'crypto';

@Module({
  imports: [
    CqrsModule,
    CommonModule,
    DrizzleModule,
    RedisModule,
    ClsModule.forRoot({
      middleware: { mount: true },
      global: true,
    }),
    LoggerModule.forRootAsync({
      inject: [ClsService, EnvService],
      useFactory: (cls: ClsService, env: EnvService) => ({
        pinoHttp: {
          level: env.loggerConfig.level,
          genReqId() {
            const id = randomBytes(4).toString('hex');
            cls.set('requestId', id);
            return id;
          },
          autoLogging: {
            ignore: (req) => {
              return req.url === '/favicon.ico';
            },
          },
          transport:
            process.env.NODE_ENV !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'yyyy-mm-dd HH:MM:ss',
                    singleLine: false,
                    ignore: 'pid,hostname,req,res',
                  },
                }
              : undefined,

          customProps: (req) => {
            return {
              requestId: cls.get('requestId'),
              userId: cls.get('userId'),
            };
          },
          customSuccessMessage(req, res) {
            return `${req.method} ${req.url} (${res.statusCode})`;
          },

          customErrorMessage(req, res, err) {
            return `${req.method} ${req.url} failed: ${err.message}`;
          },
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    //consumer.apply(MulterMaxSizeMiddleware).forRoutes('upload', 'register');
  }
}
