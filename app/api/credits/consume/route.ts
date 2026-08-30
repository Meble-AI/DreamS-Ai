export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

type ConsumeCreditBody = {
  amount?: number;
};

function cleanEnvironmentValue(
  value: string | undefined
): string {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
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
      "Nieprawidłowy adres Supabase."
    );
  }

  if (
    parsedUrl.protocol !== "https:"
  ) {
    throw new Error(
      "Adres Supabase musi używać HTTPS."
    );
  }

  return parsedUrl.origin;
}

function getSupabaseConfig() {
  const rawSupabaseUrl =
    cleanEnvironmentValue(
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL
    );

  const supabaseServiceRoleKey =
    cleanEnvironmentValue(
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_KEY
    );

  if (
    !rawSupabaseUrl ||
    !supabaseServiceRoleKey
  ) {
    throw new Error(
      "Brak konfiguracji Supabase dla API kredytów."
    );
  }

  return {
    supabaseUrl:
      normalizeSupabaseUrl(
        rawSupabaseUrl
      ),

    supabaseServiceRoleKey,
  };
}

function getAdminClient() {
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

function getAccessToken(
  req: Request
): string | null {
  const authorization =
    req.headers.get(
      "authorization"
    );

  if (!authorization) {
    return null;
  }

  const [scheme, token] =
    authorization.split(" ");

  if (
    scheme?.toLowerCase() !==
      "bearer" ||
    !token?.trim()
  ) {
    return null;
  }

  return token.trim();
}

async function getAuthenticatedUser(
  req: Request
) {
  const accessToken =
    getAccessToken(req);

  if (!accessToken) {
    return {
      error:
        Response.json(
          {
            success: false,
            error:
              "Brak sesji użytkownika.",
          },
          {
            status: 401,
          }
        ),

      user: null,
    };
  }

  const admin =
    getAdminClient();

  const {
    data,
    error,
  } =
    await admin.auth.getUser(
      accessToken
    );

  if (error) {
    console.error(
      "SUPABASE AUTH VALIDATION ERROR:",
      error.message
    );

    return {
      error:
        Response.json(
          {
            success: false,
            error:
              "Sesja wygasła. Zaloguj się ponownie.",
          },
          {
            status: 401,
          }
        ),

      user: null,
    };
  }

  if (!data.user) {
    console.error(
      "SUPABASE AUTH VALIDATION ERROR: brak użytkownika dla tokenu."
    );

    return {
      error:
        Response.json(
          {
            success: false,
            error:
              "Sesja wygasła. Zaloguj się ponownie.",
          },
          {
            status: 401,
          }
        ),

      user: null,
    };
  }

  if (!data.user.email) {
    console.error(
      "SUPABASE AUTH VALIDATION ERROR: użytkownik nie ma adresu e-mail."
    );

    return {
      error:
        Response.json(
          {
            success: false,
            error:
              "Konto użytkownika nie ma przypisanego adresu e-mail.",
          },
          {
            status: 401,
          }
        ),

      user: null,
    };
  }

  return {
    error: null,
    user: data.user,
  };
}

async function getCredits(
  email: string
) {
  const admin =
    getAdminClient();

  const {
    data: profile,
    error: profileError,
  } =
    await admin
      .from("profiles")
      .select("credits")
      .eq("email", email)
      .maybeSingle();

  if (profileError) {
    throw new Error(
      profileError.message
    );
  }

  return Number(
    profile?.credits || 0
  );
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
      !auth.user?.email
    ) {
      return auth.error!;
    }

    const credits =
      await getCredits(
        auth.user.email
      );

    return Response.json({
      success: true,
      credits,
    });
  } catch (
    error: unknown
  ) {
    console.error(
      "CREDIT STATUS ERROR:",
      error
    );

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Nie udało się sprawdzić salda kredytów.",
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
      !auth.user?.email
    ) {
      return auth.error!;
    }

    const body =
      (await req
        .json()
        .catch(
          () => ({})
        )) as ConsumeCreditBody;

    const requestedAmount =
      Number(
        body.amount ?? 1
      );

    if (
      !Number.isInteger(
        requestedAmount
      ) ||
      requestedAmount !== 1
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Nieprawidłowa liczba kredytów.",
        },
        {
          status: 400,
        }
      );
    }

    const email =
      auth.user.email;

    const admin =
      getAdminClient();

    for (
      let attempt = 0;
      attempt < 3;
      attempt += 1
    ) {
      const currentCredits =
        await getCredits(
          email
        );

      if (
        currentCredits < 1
      ) {
        return Response.json(
          {
            success: false,

            error:
              "Brak kredytów. Kup pakiet, aby wygenerować kolejną wersję projektu.",

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

      const {
        data: updated,
        error: updateError,
      } =
        await admin
          .from("profiles")
          .update({
            credits:
              nextCredits,
          })
          .eq(
            "email",
            email
          )
          .eq(
            "credits",
            currentCredits
          )
          .select("credits")
          .maybeSingle();

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      if (updated) {
        return Response.json({
          success: true,

          credits:
            Number(
              updated.credits ||
                0
            ),
        });
      }
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
  } catch (
    error: unknown
  ) {
    console.error(
      "CREDIT CONSUME ERROR:",
      error
    );

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Nie udało się rozliczyć kredytu.",
      },
      {
        status: 500,
      }
    );
  }
}