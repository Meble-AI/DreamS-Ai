export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Brak konfiguracji Supabase dla API kredytów.");
}

const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

type ConsumeCreditBody = {
  amount?: number;
};

async function getAuthenticatedUser(req: Request) {
  const authorization = req.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      error: Response.json(
        { success: false, error: "Brak sesji użytkownika." },
        { status: 401 }
      ),
      user: null,
    };
  }

  const accessToken = authorization.replace("Bearer ", "").trim();

  if (!accessToken) {
    return {
      error: Response.json(
        { success: false, error: "Brak ważnego tokenu użytkownika." },
        { status: 401 }
      ),
      user: null,
    };
  }

  const authClient = createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data: userData, error: userError } =
    await authClient.auth.getUser(accessToken);

  if (userError || !userData.user?.email) {
    return {
      error: Response.json(
        { success: false, error: "Sesja wygasła. Zaloguj się ponownie." },
        { status: 401 }
      ),
      user: null,
    };
  }

  return {
    error: null,
    user: userData.user,
  };
}

async function getCredits(email: string) {
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("credits")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return Number(profile?.credits || 0);
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req);

    if (auth.error || !auth.user?.email) {
      return auth.error!;
    }

    const credits = await getCredits(auth.user.email);

    return Response.json({
      success: true,
      credits,
    });
  } catch (error: unknown) {
    console.error("CREDIT STATUS ERROR:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się sprawdzić salda kredytów.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req);

    if (auth.error || !auth.user?.email) {
      return auth.error!;
    }

    const body = (await req.json().catch(() => ({}))) as ConsumeCreditBody;
    const requestedAmount = Number(body.amount ?? 1);

    if (!Number.isInteger(requestedAmount) || requestedAmount !== 1) {
      return Response.json(
        { success: false, error: "Nieprawidłowa liczba kredytów." },
        { status: 400 }
      );
    }

    const email = auth.user.email;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const currentCredits = await getCredits(email);

      if (currentCredits < 1) {
        return Response.json(
          {
            success: false,
            error: "Brak kredytów. Kup pakiet, aby wygenerować kolejną wersję projektu.",
            credits: currentCredits,
          },
          { status: 402 }
        );
      }

      const nextCredits = currentCredits - 1;

      const { data: updated, error: updateError } = await admin
        .from("profiles")
        .update({ credits: nextCredits })
        .eq("email", email)
        .eq("credits", currentCredits)
        .select("credits")
        .maybeSingle();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (updated) {
        return Response.json({
          success: true,
          credits: Number(updated.credits || 0),
        });
      }
    }

    return Response.json(
      {
        success: false,
        error: "Nie udało się bezpiecznie rozliczyć kredytu. Spróbuj ponownie.",
      },
      { status: 409 }
    );
  } catch (error: unknown) {
    console.error("CREDIT CONSUME ERROR:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Nie udało się rozliczyć kredytu.",
      },
      { status: 500 }
    );
  }
}
