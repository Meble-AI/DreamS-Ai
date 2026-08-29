export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const PRODUCTION_APP_URL =
  "https://dreamsai.pl";

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

function getProductionSupabaseConfig() {

  const url =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL
    );

  const anonKey =
    cleanEnvironmentValue(
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

  if (
    !url ||
    !anonKey
  ) {

    return null;
  }

  return {
    url:
      url.replace(
        /\/+$/,
        ""
      ),

    anonKey,
  };
}

function copyRequestHeaders(
  req:
    Request,
  anonKey?:
    string
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
    (
      headerName
    ) => {

      const value =
        req.headers.get(
          headerName
        );

      if (
        value
      ) {

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

  if (
    anonKey
  ) {

    headers.set(
      "apikey",
      anonKey
    );

    /*
     * Jeśli klient jest niezalogowany, supabase-js wysyła
     * nasz techniczny lokalny klucz. Podmieniamy go na
     * prawdziwy ANON key dopiero na serwerze Vercel.
     *
     * Jeśli klient jest zalogowany, zachowujemy jego JWT.
     */
    const isLocalProxyAuthorization =
      !incomingAuthorization ||
      incomingAuthorization.includes(
        "local-development-proxy-key"
      );

    headers.set(
      "authorization",
      isLocalProxyAuthorization
        ? `Bearer ${anonKey}`
        : incomingAuthorization!
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
  source:
    Headers
): Headers {

  const headers =
    new Headers();

  const blocked = new Set([
    "connection",
    "content-encoding",
    "content-length",
    "keep-alive",
    "transfer-encoding",
  ]);

  source.forEach(
    (
      value,
      key
    ) => {

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

async function proxyRequest(
  req:
    Request,
  context:
    {
      params:
        Promise<{
          path:
            string[];
        }>;
    }
): Promise<Response> {

  const {
    path = [],
  } =
    await context.params;

  const sourceUrl =
    new URL(
      req.url
    );

  const pathString =
    path
      .map(
        encodeURIComponent
      )
      .join(
        "/"
      );

  const productionConfig =
    getProductionSupabaseConfig();

  let targetUrl:
    URL;

  let headers:
    Headers;

  if (
    productionConfig
  ) {

    /*
     * PRODUKCJA:
     * bezpośrednio do prawdziwego Supabase.
     */
    targetUrl =
      new URL(
        `${productionConfig.url}/${pathString}`
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
     * LOCALHOST:
     * nie mamy lokalnego URL ani ANON key,
     * więc idziemy do tego samego route na dreamsai.pl.
     *
     * Tam środowisko Vercel ma prawidłowe zmienne
     * i wykona dopiero połączenie z Supabase.
     */
    if (
      process.env.VERCEL ===
      "1"
    ) {

      return Response.json(
        {
          error:
            "Brak konfiguracji Supabase w środowisku produkcyjnym Vercel.",
        },
        {
          status:
            500,
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
    ArrayBuffer |
    undefined;

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
}

export async function GET(
  req:
    Request,
  context:
    {
      params:
        Promise<{
          path:
            string[];
        }>;
    }
) {

  return proxyRequest(
    req,
    context
  );
}

export async function POST(
  req:
    Request,
  context:
    {
      params:
        Promise<{
          path:
            string[];
        }>;
    }
) {

  return proxyRequest(
    req,
    context
  );
}

export async function PUT(
  req:
    Request,
  context:
    {
      params:
        Promise<{
          path:
            string[];
        }>;
    }
) {

  return proxyRequest(
    req,
    context
  );
}

export async function PATCH(
  req:
    Request,
  context:
    {
      params:
        Promise<{
          path:
            string[];
        }>;
    }
) {

  return proxyRequest(
    req,
    context
  );
}

export async function DELETE(
  req:
    Request,
  context:
    {
      params:
        Promise<{
          path:
            string[];
        }>;
    }
) {

  return proxyRequest(
    req,
    context
  );
}

export async function OPTIONS(
  req:
    Request,
  context:
    {
      params:
        Promise<{
          path:
            string[];
        }>;
    }
) {

  return proxyRequest(
    req,
    context
  );
}
