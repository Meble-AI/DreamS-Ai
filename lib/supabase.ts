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

const useLocalSupabaseProxy =
  !configuredSupabaseUrl ||
  !configuredSupabaseAnonKey;

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

/*
 * Ochrona przepływu kredytów:
 *
 * 1. Wszystkie wywołania /api/chat dostają automatycznie JWT
 *    aktualnie zalogowanego użytkownika. Dzięki temu API może
 *    sprawdzić saldo i rozliczyć kredyt po stronie serwera.
 *
 * 2. Stary dashboard nadal ma historyczny kod wykonujący
 *    PATCH profiles.credits po wygenerowaniu projektu.
 *    Taki zapis blokujemy w przeglądarce, aby nie naliczać
 *    kredytu drugi raz. Jedynym miejscem rozliczającym kredyt
 *    jest teraz /api/credits/consume po stronie serwera.
 */
if (
  typeof window !==
  "undefined"
) {
  const patchedWindow =
    window as Window & {
      __dreamsAiFetchPatched?: boolean;
    };

  if (
    !patchedWindow
      .__dreamsAiFetchPatched
  ) {
    const originalFetch =
      window.fetch.bind(
        window
      );

    window.fetch =
      async (
        input:
          RequestInfo |
          URL,
        init?:
          RequestInit
      ) => {
        const requestUrl =
          typeof input ===
          "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        const method =
          String(
            init?.method ||
            (
              input instanceof Request
                ? input.method
                : "GET"
            )
          ).toUpperCase();

        const isChatRequest =
          requestUrl ===
            "/api/chat" ||
          requestUrl.endsWith(
            "/api/chat"
          );

        if (
          isChatRequest &&
          method === "POST"
        ) {
          const {
            data: sessionData,
          } =
            await supabase.auth
              .getSession();

          const accessToken =
            sessionData.session
              ?.access_token;

          const headers =
            new Headers(
              init?.headers ||
              (
                input instanceof Request
                  ? input.headers
                  : undefined
              )
            );

          if (accessToken) {
            headers.set(
              "authorization",
              `Bearer ${accessToken}`
            );
          }

          return originalFetch(
            input,
            {
              ...init,
              headers,
            }
          );
        }

        const isProfilesRequest =
          /\/rest\/v1\/profiles(?:\?|$)/.test(
            requestUrl
          ) ||
          /\/api\/supabase\/rest\/v1\/profiles(?:\?|$)/.test(
            requestUrl
          );

        if (
          isProfilesRequest &&
          method === "PATCH"
        ) {
          let bodyText =
            "";

          if (
            typeof init?.body ===
            "string"
          ) {
            bodyText =
              init.body;
          }

          let changesCredits =
            false;

          try {
            const parsed =
              bodyText
                ? JSON.parse(
                    bodyText
                  )
                : null;

            changesCredits =
              Boolean(
                parsed &&
                typeof parsed ===
                  "object" &&
                "credits" in parsed
              );
          } catch {
            changesCredits =
              bodyText.includes(
                '"credits"'
              );
          }

          if (changesCredits) {
            console.warn(
              "Zablokowano bezpośrednią zmianę credits po stronie klienta."
            );

            return new Response(
              null,
              {
                status: 204,
                headers: {
                  "cache-control":
                    "no-store",
                },
              }
            );
          }
        }

        return originalFetch(
          input,
          init
        );
      };

    patchedWindow
      .__dreamsAiFetchPatched =
      true;
  }
}
