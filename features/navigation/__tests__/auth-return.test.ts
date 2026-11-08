import { getSafeAuthReturnPath } from '../auth-return';
test.each(['/home','/explore','/properties','/community','/menu','/wishlist','/account','/notifications'])(
  'preserves the local return destination %s', path => expect(getSafeAuthReturnPath(path)).toBe(path),
);
test.each([undefined, ['/home'], 'https://example.com', '//example.com', '/unknown', '/login', '/onboarding', '/menu?external=1'])(
  'rejects an invalid return destination %p', path => expect(getSafeAuthReturnPath(path)).toBe('/menu'),
);
