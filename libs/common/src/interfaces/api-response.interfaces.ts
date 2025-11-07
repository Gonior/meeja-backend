import { CookieOptions } from 'express';
import { COOKIE_KEY } from '@app/common';
type CookieKey = (typeof COOKIE_KEY)[keyof typeof COOKIE_KEY];

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  clearCookies?: CookieKey[];
  setCookies?: {
    name: (typeof COOKIE_KEY)[keyof typeof COOKIE_KEY];
    value: string;
    options?: CookieOptions;
  }[];
}
