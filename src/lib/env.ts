/** Server-side feature flags from environment. Safe defaults = demo mode. */

export function hasSupabase(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY),
  );
}

export function hasSupabaseAuth(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY);
}

export function getPublicConfig() {
  return {
    supabaseUrl: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    supabaseAnonKey:
      process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null,
    authMode: hasSupabaseAuth() ? ("supabase" as const) : ("demo" as const),
    agentMode: hasOpenAI() ? ("openai" as const) : ("demo" as const),
    dataMode: hasSupabase() ? ("supabase" as const) : ("local" as const),
  };
}
