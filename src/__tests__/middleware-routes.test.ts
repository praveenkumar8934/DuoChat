import { describe, it, expect } from 'vitest';

describe('Middleware Route Protection Rules', () => {
  const isPublicRoute = (pathname: string): boolean => {
    return (
      pathname === '/' ||
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password' ||
      pathname === '/privacy' ||
      pathname === '/terms' ||
      pathname === '/about' ||
      pathname === '/safety' ||
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/invite') ||
      pathname.startsWith('/api/auth')
    );
  };

  const isAuthEntryRoute = (pathname: string): boolean => {
    return (
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password'
    );
  };

  const determineRedirect = (pathname: string, user: { id: string } | null): string | null => {
    // 1. Unauthenticated users cannot access protected app areas
    if (!user && !isPublicRoute(pathname)) {
      return `/login?redirectTo=${encodeURIComponent(pathname)}`;
    }

    // 2. Authenticated users accessing login/signup forms are redirected directly to chat
    if (user && isAuthEntryRoute(pathname)) {
      return '/chat';
    }

    // No redirect needed - proceed to route
    return null;
  };

  describe('Unauthenticated visitors (First-time / Link openers)', () => {
    it('allows opening the landing page ("/") without redirecting to login', () => {
      const redirect = determineRedirect('/', null);
      expect(redirect).toBeNull();
    });

    it('allows opening public auth pages (/login, /signup, etc.)', () => {
      expect(determineRedirect('/login', null)).toBeNull();
      expect(determineRedirect('/signup', null)).toBeNull();
      expect(determineRedirect('/forgot-password', null)).toBeNull();
      expect(determineRedirect('/reset-password', null)).toBeNull();
    });

    it('allows opening invitation links without forcing pre-login', () => {
      expect(determineRedirect('/invite/love-token-123', null)).toBeNull();
    });

    it('protects private chat and settings routes by redirecting to login with redirectTo', () => {
      expect(determineRedirect('/chat', null)).toBe('/login?redirectTo=%2Fchat');
      expect(determineRedirect('/settings', null)).toBe('/login?redirectTo=%2Fsettings');
      expect(determineRedirect('/api/chat/clear', null)).toBe('/login?redirectTo=%2Fapi%2Fchat%2Fclear');
    });
  });

  describe('Authenticated visitors', () => {
    const mockUser = { id: 'user-uuid-123' };

    it('allows authenticated users to view the landing page ("/")', () => {
      const redirect = determineRedirect('/', mockUser);
      expect(redirect).toBeNull();
    });

    it('redirects authenticated users away from auth forms (/login, /signup) to /chat', () => {
      expect(determineRedirect('/login', mockUser)).toBe('/chat');
      expect(determineRedirect('/signup', mockUser)).toBe('/chat');
      expect(determineRedirect('/forgot-password', mockUser)).toBe('/chat');
      expect(determineRedirect('/reset-password', mockUser)).toBe('/chat');
    });

    it('allows authenticated users to access protected chat and settings', () => {
      expect(determineRedirect('/chat', mockUser)).toBeNull();
      expect(determineRedirect('/settings', mockUser)).toBeNull();
    });
  });
});
