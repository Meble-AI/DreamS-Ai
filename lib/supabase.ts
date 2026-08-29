import {
  createClient,
} from "@supabase/supabase-js";

function cleanEnvironmentValue(
  value:
    string |
    undefined
): string {

  return String(
    value ||
    ""
  )
    .trim()
    .replace(
      /^["']|["']$/g,
      ""
    );
}

function normalizeSupabaseUrl(
  value:
    string |
    undefined
): string {

  const rawValue =
    cleanEnvironmentValue(
      value
    );

  if (
    !rawValue
  ) {

    throw new Error(
      "Brak NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  let parsedUrl:
    URL;

  try {

    parsedUrl =
      new URL(
        rawValue
      );

  } catch {

    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL nie jest prawidłowym adresem URL."
    );
  }

  if (
    parsedUrl.protocol !==
      "https:" ||
    !parsedUrl.hostname.endsWith(
      ".supabase.co"
    )
  ) {

    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL musi mieć format https://xxxxx.supabase.co."
    );
  }

  return parsedUrl.origin;
}

const configuredSupabaseUrl =
  cleanEnvironmentValue(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL
  );

const configuredSupabaseAnonKey =
  cleanEnvironmentValue(
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

/*
 * W DEVELOPMENT nie wymagamy lokalnych kluczy Supabase.
 *
 * Przeglądarka łączy się z:
 *   localhost/api/supabase/...
 *
 * Lokalny route przekazuje żądania do dreamsai.pl,
 * a produkcyjny route dopiero do prawdziwego Supabase.
 *
 * Dzięki temu:
 * - localhost działa bez .env.local,
 * - produkcja nadal używa własnych zmiennych Vercel,
 * - żaden sekret serwerowy nie trafia do przeglądarki.
 */
const useLocalSupabaseProxy =
  process.env.NODE_ENV !==
    "production" &&
  (
    !configuredSupabaseUrl ||
    !configuredSupabaseAnonKey
  );

const localProxyUrl =
  typeof window !==
    "undefined"
      ? `${window.location.origin}/api/supabase`
      : "http://localhost:3000/api/supabase";

const supabaseUrl =
  useLocalSupabaseProxy
    ? localProxyUrl
    : normalizeSupabaseUrl(
        configuredSupabaseUrl
      );

const supabaseAnonKey =
  useLocalSupabaseProxy
    ? "local-development-proxy-key"
    : configuredSupabaseAnonKey;

if (
  !supabaseAnonKey
) {

  throw new Error(
    "Brak NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase =
  createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession:
          true,

        autoRefreshToken:
          true,

        detectSessionInUrl:
          true,

        flowType:
          "pkce",
      },
    }
  );
