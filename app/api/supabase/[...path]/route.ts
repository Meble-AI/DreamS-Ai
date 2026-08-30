export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const PRODUCTION_APP_URL = "https://dreamsai.pl";

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

  /*
   * WAŻNE:
   * createClient i proxy potrzebują głównego
   * adresu projektu:
   *
   * https://xxxxx.supabase.co
   *
   * Jeżeli w ENV przypadkowo znalazło się np.
   * /rest/v1, /auth/v1 itd., usuwamy tę część.
   */
  return parsedUrl.origin;
}

function getProductionSupabaseConfig() {
  const rawUrl =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL ||
        process.env.SUPABASE_URL
    );

  const anonKey =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

  if (
    !rawUrl ||
    !anonKey
  ) {
    return null;
  }

  return {
    url:
      normalizeSupabaseUrl(
        rawUrl
      ),

    anonKey,
  };
}

function copyRequestHeaders(
  req: Request,
  anonKey?: string
): Headers {
  const headers =
    new Headers();

  const passThroughHeaders = [
    "accept",
    "accept-language",
    "content-type",
    "prefer",
    "range",
    "x-client-info",
    "x-supabase-api-version",
  ];

  passThroughHeaders.forEach(
    (headerName) => {
      const value =
        req.headers.get(
          headerName
        );

      if (value) {
        headers.set(
          headerName,
          value
        );
      }
    }
  );

  const incomingAuthorization =
    req.headers.get(
      "authorization"
    );

  if (anonKey) {
    headers.set(
      "apikey",
      anonKey
    );

    const isLocalProxyAuthorization =
      !incomingAuthorization ||
      incomingAuthorization.includes(
        "local-development-proxy-key"
      );

    headers.set(
      "authorization",
      isLocalProxyAuthorization
        ? `Bearer ${anonKey}`
        : incomingAuthorization
    );
  } else if (
    incomingAuthorization
  ) {
    headers.set(
      "authorization",
      incomingAuthorization
    );
  }

  return headers;
}

function copyResponseHeaders(
  source: Headers
): Headers {
  const headers =
    new Headers();

  const blocked =
    new Set([
      "connection",
      "content-encoding",
      "content-length",
      "keep-alive",
      "transfer-encoding",
    ]);

  source.forEach(
    (value, key) => {
      if (
        !blocked.has(
          key.toLowerCase()
        )
      ) {
        headers.set(
          key,
          value
        );
      }
    }
  );

  headers.set(
    "cache-control",
    "no-store"
  );

  return headers;
}

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

async function proxyRequest(
  req: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const {
      path = [],
    } =
      await context.params;

    if (
      !Array.isArray(path) ||
      path.length === 0
    ) {
      return Response.json(
        {
          error:
            "Brak ścieżki Supabase.",
        },
        {
          status: 400,
        }
      );
    }

    const sourceUrl =
      new URL(req.url);

    const pathString =
      path
        .map(
          (segment) =>
            encodeURIComponent(
              segment
            )
        )
        .join("/");

    const productionConfig =
      getProductionSupabaseConfig();

    let targetUrl: URL;

    let headers: Headers;

    if (
      productionConfig
    ) {
      /*
       * Przykład:
       *
       * BASE:
       * https://xxxxx.supabase.co
       *
       * PATH:
       * auth/v1/token
       *
       * FINAL:
       * https://xxxxx.supabase.co/auth/v1/token
       */
      targetUrl =
        new URL(
          `/${pathString}`,
          productionConfig.url
        );

      targetUrl.search =
        sourceUrl.search;

      headers =
        copyRequestHeaders(
          req,
          productionConfig.anonKey
        );
    } else {
      /*
       * Lokalnie, gdy nie ma zmiennych Supabase,
       * przesyłamy żądanie do produkcyjnego proxy.
       */
      if (
        process.env.VERCEL ===
        "1"
      ) {
        return Response.json(
          {
            error:
              "Brak konfiguracji Supabase w środowisku Vercel.",
          },
          {
            status: 500,
          }
        );
      }

      targetUrl =
        new URL(
          `/api/supabase/${pathString}`,
          PRODUCTION_APP_URL
        );

      targetUrl.search =
        sourceUrl.search;

      headers =
        copyRequestHeaders(
          req
        );
    }

    const method =
      req.method.toUpperCase();

    let body:
      | ArrayBuffer
      | undefined;

    if (
      method !== "GET" &&
      method !== "HEAD"
    ) {
      const requestBody =
        await req.arrayBuffer();

      if (
        requestBody.byteLength >
        0
      ) {
        body =
          requestBody;
      }
    }

    const response =
      await fetch(
        targetUrl,
        {
          method,
          headers,
          body,
          redirect:
            "manual",
          cache:
            "no-store",
        }
      );

    return new Response(
      response.body,
      {
        status:
          response.status,

        statusText:
          response.statusText,

        headers:
          copyResponseHeaders(
            response.headers
          ),
      }
    );
  } catch (error: unknown) {
    console.error(
      "SUPABASE PROXY ERROR:",
      error instanceof Error
        ? error.message
        : error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Błąd połączenia z Supabase.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(
  req: Request,
  context: RouteContext
) {
  return proxyRequest(
    req,
    context
  );
}

export async function POST(
  req: Request,
  context: RouteContext
) {
  return proxyRequest(
    req,
    context
  );
}

export async function PUT(
  req: Request,
  context: RouteContext
) {
  return proxyRequest(
    req,
    context
  );
}

export async function PATCH(
  req: Request,
  context: RouteContext
) {
  return proxyRequest(
    req,
    context
  );
}

export async function DELETE(
  req: Request,
  context: RouteContext
) {
  return proxyRequest(
    req,
    context
  );
}

export async function OPTIONS(
  req: Request,
  context: RouteContext
) {
  return proxyRequest(
    req,
    context
  );
}