import { createServerClient } from './lib/supabase/server.ts';

/**
 * Next.js Middleware for Role-Based Access Control (RBAC)
 * Protects:
 *   - /admin/* routes: requires authenticated user with role === 'admin'
 *   - /profile/* routes: requires authenticated user
 */
export async function middleware(request: any) {
  const url = new URL(request.url || 'http://localhost:3000');
  const pathname = url.pathname;

  const isAdminRoute = pathname.startsWith('/admin');
  const isProfileRoute = pathname.startsWith('/profile');

  if (!isAdminRoute && !isProfileRoute) {
    return { ok: true, status: 200 };
  }

  const supabase = createServerClient();
  const token = request.headers?.get?.('authorization')?.replace('Bearer ', '') ||
                request.cookies?.get?.('sb-access-token')?.value;

  if (!token) {
    // If not authenticated, redirect to login with callback URL
    return {
      redirect: `/login?callbackUrl=${encodeURIComponent(pathname)}`,
      status: 307,
    };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return {
      redirect: `/login?callbackUrl=${encodeURIComponent(pathname)}`,
      status: 307,
    };
  }

  if (isAdminRoute) {
    // Check if user has admin role in profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      // Forbidden: redirect to home or unauthorized page
      return {
        redirect: '/?unauthorized=admin_required',
        status: 307,
      };
    }
  }

  return { ok: true, status: 200 };
}

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*'],
};
