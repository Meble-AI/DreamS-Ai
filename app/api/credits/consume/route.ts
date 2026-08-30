export const runtime = "nodejs";

import {
  createClient,
  SupabaseClient,
} from "@supabase/supabase-js";

function cleanEnvironmentValue(
  value: string | undefined
): string {
  return String(value || "")
    .trim()
    .replace(/^[\"']|[\"']$/g, "");
}

function normalizeSupabaseUrl(
  value: string | undefined
): string {
  const rawValue =
    cleanEnvironmentValue(value);

  if (!rawValue) {
    throw new Error(
      "Brak adresu Supabase."
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl =
      new URL(rawValue);
  } catch {
    throw new Error(
      "Adres Supabase jest nieprawidłowy."
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
      "Adres Supabase musi mieć format https://xxxxx.supabase.co."
    );
  }

  return parsedUrl.origin;
}

function getSupabaseConfig() {
  const supabaseUrl =
    normalizeSupabaseUrl(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL
    );

  const supabaseAnonKey =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

  const supabaseServiceRoleKey =
    cleanEnvironmentValue(
      process.env
        .SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_KEY ||
        process.env
          .NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

  if (!supabaseAnonKey) {
    throw new Error(
      "Brak NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "Brak klucza Supabase do autoryzacji."
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
  };
}

function getAuthClient() {
  const {
    supabaseUrl,
    supabaseServiceRoleKey,
  } =
    getSupabaseConfig();

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

function getUserClient(
  accessToken: string
) {
  const {
    supabaseUrl,
    supabaseAnonKey,
  } =
    getSupabaseConfig();

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },

      global: {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },
    }
  );
}

function getBearerToken(
  req: Request
): string {
  const authorization =
    req.headers.get(
      "authorization"
    ) || "";

  if (
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return "";
  }

  return authorization
    .slice(7)
    .trim();
}

async function getAuthenticatedUser(
  req: Request
) {
  const accessToken =
    getBearerToken(req);

  if (!accessToken) {
    return {
      error:
        "Brak sesji użytkownika.",
      user: null,
      accessToken: "",
    };
  }

  try {
    const authClient =
      getAuthClient();

    const {
      data,
      error,
    } =
      await authClient.auth.getUser(
        accessToken
      );

    if (
      error ||
      !data.user
    ) {
      console.error(
        "SUPABASE AUTH VALIDATION ERROR:",
        error?.message ||
          "Brak użytkownika"
      );

      return {
        error:
          "Sesja wygasła. Zaloguj się ponownie.",
        user: null,
        accessToken: "",
      };
    }

    return {
      error: null,
      user: data.user,
      accessToken,
    };
  } catch (error) {
    console.error(
      "SUPABASE AUTH VALIDATION ERROR:",
      error instanceof Error
        ? error.message
        : error
    );

    return {
      error:
        "Nie udało się zweryfikować sesji użytkownika.",
      user: null,
      accessToken: "",
    };
  }
}

async function getCredits(
  supabase: SupabaseClient,
  email: string
): Promise<number> {
  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select("credits")
      .eq(
        "email",
        email
      )
      .maybeSingle();

  if (profileError) {
    throw new Error(
      profileError.message
    );
  }

  if (!profile) {
    console.error(
      "CREDIT PROFILE ERROR: profil użytkownika nie został znaleziony."
    );

    return 0;
  }

  const credits =
    Number(
      profile.credits || 0
    );

  console.log(
    "BACKEND CREDITS:",
    credits
  );

  return credits;
}

export async function GET(
  req: Request
) {
  try {
    const auth =
      await getAuthenticatedUser(
        req
      );

    if (
      auth.error ||
      !auth.user ||
      !auth.accessToken
    ) {
      return Response.json(
        {
          success: false,
          error:
            auth.error ||
            "Brak sesji użytkownika.",
        },
        {
          status: 401,
        }
      );
    }

    const email =
      String(
        auth.user.email || ""
      )
        .trim()
        .toLowerCase();

    if (!email) {
      return Response.json(
        {
          success: false,
          error:
            "Konto użytkownika nie posiada adresu e-mail.",
        },
        {
          status: 400,
        }
      );
    }

    const userClient =
      getUserClient(
        auth.accessToken
      );

    const credits =
      await getCredits(
        userClient,
        email
      );

    return Response.json({
      success: true,
      credits,
    });
  } catch (error) {
    console.error(
      "CREDITS GET ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Nie udało się pobrać liczby kredytów.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  req: Request
) {
  try {
    const auth =
      await getAuthenticatedUser(
        req
      );

    if (
      auth.error ||
      !auth.user ||
      !auth.accessToken
    ) {
      return Response.json(
        {
          success: false,
          error:
            auth.error ||
            "Brak sesji użytkownika.",
        },
        {
          status: 401,
        }
      );
    }

    const email =
      String(
        auth.user.email || ""
      )
        .trim()
        .toLowerCase();

    if (!email) {
      return Response.json(
        {
          success: false,
          error:
            "Konto użytkownika nie posiada adresu e-mail.",
        },
        {
          status: 400,
        }
      );
    }

    const userClient =
      getUserClient(
        auth.accessToken
      );

    /*
     * Maksymalnie 3 próby.
     *
     * Po każdej aktualizacji ponownie
     * pobieramy saldo z Supabase.
     *
     * Kredyt uznajemy za rozliczony
     * dopiero wtedy, gdy baza faktycznie
     * zwróci saldo pomniejszone o 1.
     */
    for (
      let attempt = 0;
      attempt < 3;
      attempt++
    ) {
      const currentCredits =
        await getCredits(
          userClient,
          email
        );

      if (
        currentCredits < 1
      ) {
        return Response.json(
          {
            success: false,
            error:
              "Brak kredytów.",
            credits:
              currentCredits,
          },
          {
            status: 402,
          }
        );
      }

      const nextCredits =
        currentCredits - 1;

      /*
       * Aktualizacja wykonana w kontekście
       * zalogowanego użytkownika.
       *
       * Jest to zgodne z mechanizmem,
       * który wcześniej działał
       * bezpośrednio z dashboardu.
       */
      const {
        error: updateError,
      } =
        await userClient
          .from("profiles")
          .update({
            credits:
              nextCredits,
          })
          .eq(
            "email",
            email
          );

      if (updateError) {
        console.error(
          "CREDIT UPDATE ERROR:",
          updateError.message
        );

        throw new Error(
          updateError.message
        );
      }

      /*
       * Nie ufamy samemu brakowi błędu.
       * Sprawdzamy saldo ponownie.
       */
      const verifiedCredits =
        await getCredits(
          userClient,
          email
        );

      if (
        verifiedCredits ===
        nextCredits
      ) {
        console.log(
          "CREDIT CONSUMED:",
          currentCredits,
          "->",
          verifiedCredits
        );

        return Response.json({
          success: true,
          credits:
            verifiedCredits,
        });
      }

      console.warn(
        "CREDIT UPDATE NOT CONFIRMED:",
        {
          attempt:
            attempt + 1,
          expected:
            nextCredits,
          received:
            verifiedCredits,
        }
      );
    }

    return Response.json(
      {
        success: false,
        error:
          "Nie udało się bezpiecznie rozliczyć kredytu. Spróbuj ponownie.",
      },
      {
        status: 409,
      }
    );
  } catch (error) {
    console.error(
      "CREDITS POST ERROR:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "Nie udało się rozliczyć kredytu.",
      },
      {
        status: 500,
      }
    );
  }
}