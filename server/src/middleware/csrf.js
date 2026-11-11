import { doubleCsrf } from 'csrf-csrf';
import { requireAuth } from './auth.js';

const production = process.env.NODE_ENV === 'production';
export const csrfCookieName = production ? '__Host-csrf-token' : 'csrf-token';
export const csrfCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: production,
  path: '/'
};

export const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  // Resolve lazily: dotenv and test setup may load after this module is imported.
  getSecret: () => {
    const secret = process.env.CSRF_SECRET || process.env.JWT_SECRET;
    if (!secret) throw new Error('CSRF_SECRET or JWT_SECRET must be configured');
    return secret;
  },
  // requireAuth verifies this JWT before token generation or validation.
  getSessionIdentifier: req => req.cookies.token,
  cookieName: csrfCookieName,
  cookieOptions: csrfCookieOptions,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  // Never read this value from the cookie: that would defeat CSRF protection.
  getCsrfTokenFromRequest: req => req.headers['x-csrf-token']
});

export function clearCsrfCookie(res) {
  res.clearCookie(csrfCookieName, csrfCookieOptions);
}

// Mounted at /api, before any application routes. Only pre-auth POSTs are exempt.
export function protectWrites(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.method === 'POST' && /^\/auth\/(login|register)\/?$/i.test(req.path)) {
    return next();
  }
  requireAuth(req, res, () => doubleCsrfProtection(req, res, next));
}
