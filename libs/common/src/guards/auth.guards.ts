import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  //   handleRequest<IJwtPayload>(err: any, user: IJwtPayload, info: any): IJwtPayload {
  //     console.log({ user, info, err });
  //     // jwt expired
  //     // No auth token
  //     // invalid signature
  //     if (info?.message === 'jwt expired' || info?.message === 'invalid signature') {
  //       throw new UnauthorizedException('Token is invalid or expired');
  //     }
  //     if (info?.message === 'No auth token') {
  //       throw new UnauthorizedException('Token is missing');
  //     }
  //     if (err || !user) {
  //       console.log(err);
  //       throw new UnauthorizedException('Invalid Signature');
  //     }
  //     return user;
  //   }
}
