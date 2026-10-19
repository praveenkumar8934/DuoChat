import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient as createServiceClient, type User, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export interface AuthResult {
  user: User | null;
  error: string | null;
}

/**
 * Cryptographically verifies and retrieves the authenticated user from:
 * 1. Secure HTTP-only cookies via @supabase/ssr createServerClient
 * 2. Authorization Bearer JWT header verified directly against Supabase Auth
 *
 * Never trusts unauthenticated or spoofable client headers (e.g. x-user-id).
 */
export async function getAuthenticatedUser(req?: Request): Promise<AuthResult> {
  // 1. Check cookies via SSR client
  try {
    const userClient = await createServerSupabase();
    const {
      data: { user },
      error,
    } = await userClient.auth.getUser();

    if (user && !error) {
      return { user, error: null };
    }
  } catch (err) {
    // Continue to check Bearer token fallback
  }

  // 2. Check Authorization: Bearer <token> header if request is provided
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token && env.supabaseUrl && env.supabaseAnonKey) {
        try {
          const authClient = createServiceClient(env.supabaseUrl, env.supabaseAnonKey, {
            auth: { persistSession: false },
          });
          const {
            data: { user },
            error,
          } = await authClient.auth.getUser(token);

          if (user && !error) {
            return { user, error: null };
          }
        } catch {
          // Token verification failed
        }
      }
    }
  }

  return { user: null, error: 'Unauthorized: Valid authentication session is required' };
}

/**
 * Safely creates an administrative Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Only accessible on server runtime.
 */
export function getAdminSupabase(): SupabaseClient {
  const serviceKey = env.supabaseServiceRoleKey;
  if (!serviceKey || !env.supabaseUrl) {
    throw new Error('Supabase service configuration missing. Please verify SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createServiceClient(env.supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}
