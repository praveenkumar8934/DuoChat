function cleanSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

export const env = {
  supabaseUrl: cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim(),
  supabaseServiceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim(),
};

export const isSupabaseConfigured = (): boolean => {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
};

export const livekitEnv = {
  url: (process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL || '').trim(),
  apiKey: (process.env.LIVEKIT_API_KEY || '').trim(),
  apiSecret: (process.env.LIVEKIT_API_SECRET || '').trim(),
};

export const isLiveKitConfigured = (): boolean => {
  return Boolean(livekitEnv.url && livekitEnv.apiKey && livekitEnv.apiSecret);
};

