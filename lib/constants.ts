export const AUTH_COOKIE_NAME = 'auth_token';
export const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 days in seconds
export const TOKEN_EXPIRATION = '30d';

export const SIGNIN_PATH = '/signin';
export const DASHBOARD_PATH = '/dashboard';
export const ROOT_PATH = '/';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax' as const,
  maxAge: SESSION_DURATION,
  path: '/',
};
