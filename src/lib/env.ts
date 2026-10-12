function cleanSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

export const env = {
  supabaseUrl: cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || ''),
  supabaseAnonKey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim(),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

export const isSupabaseConfigured = (): boolean => {
  const url = env.supabaseUrl;
  const key = env.supabaseAnonKey;
  return Boolean(
    url &&
    key &&
    !url.includes('your-project') &&
    url.startsWith('https://') &&
    key.length > 20
  );
};
