export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
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
