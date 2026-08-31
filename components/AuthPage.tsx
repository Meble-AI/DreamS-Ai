"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "register" | "reset";

type Props = {
  mode: AuthMode;
};

function safeRedirect() {
  if (typeof window === "undefined") return "/dashboard";
  const value = new URLSearchParams(window.location.search).get("redirect");
  return value && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

function redirectQuery() {
  const value = safeRedirect();
  return value === "/dashboard" ? "" : `?redirect=${encodeURIComponent(value)}`;
}

export default function AuthPage({ mode }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(mode !== "reset");

  useEffect(() => {
    if (mode !== "reset") return;

    let mounted = true;
    let recoveryDetected = false;

    const markRecoveryReady = () => {
      if (!mounted) return;
      recoveryDetected = true;
      setRecoveryReady(true);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY") {
        markRecoveryReady();
        return;
      }

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        markRecoveryReady();
      }
    });

    async function prepareRecovery() {
      try {
        setRecoveryReady(false);

        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const searchParams = new URLSearchParams(window.location.search);
        const authError =
          hashParams.get("error_description") ||
          hashParams.get("error") ||
          searchParams.get("error_description") ||
          searchParams.get("error");

        if (authError) {
          console.error("SUPABASE RECOVERY URL ERROR:", authError);
          alert("Link do zmiany hasła jest nieprawidłowy albo został już użyty. Wyślij nowy link resetujący.");
          window.location.href = "/login";
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("GET RECOVERY SESSION ERROR:", error);
        }

        if (data.session) {
          markRecoveryReady();
          return;
        }

        window.setTimeout(async () => {
          if (!mounted || recoveryDetected) return;

          const { data: delayedSession } = await supabase.auth.getSession();

          if (delayedSession.session) {
            markRecoveryReady();
            return;
          }

          alert("Nie udało się otworzyć sesji zmiany hasła. Wyślij nowy link resetujący i otwórz tylko najnowszą wiadomość.");
          window.location.href = "/login";
        }, 2000);
      } catch (error) {
        console.error("RECOVERY ERROR:", error);
        alert("Nie udało się przygotować zmiany hasła. Wyślij nowy link resetujący.");
        window.location.href = "/login";
      }
    }

    prepareRecovery();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [mode]);

  async function login() {
    if (!email.trim() || !password) return alert("Wpisz adres e-mail i hasło.");

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) return alert(error.message);
      if (!data.session) return alert("Nie udało się utworzyć sesji.");

      window.location.href = safeRedirect();
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      alert("Błąd logowania.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    if (mode === "register" && !acceptedTerms) {
      return alert("Aby założyć konto przez Google, zaakceptuj Regulamin i Politykę prywatności.");
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${safeRedirect()}`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        console.error("GOOGLE LOGIN ERROR:", error);
        alert("Nie udało się rozpocząć logowania przez Google.");
        setLoading(false);
      }
    } catch (error) {
      console.error("GOOGLE LOGIN ERROR:", error);
      alert("Błąd logowania przez Google.");
      setLoading(false);
    }
  }

  async function register() {
    if (!email.trim() || !password) return alert("Wpisz adres e-mail i hasło.");
    if (password.length < 6) return alert("Hasło musi mieć co najmniej 6 znaków.");
    if (!acceptedTerms) return alert("Aby założyć konto, zaakceptuj Regulamin i Politykę prywatności.");

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
          data: {
            termsAccepted: true,
            termsAcceptedAt: new Date().toISOString(),
          },
        },
      });

      if (error) return alert(error.message);

      if (data.session) {
        window.location.href = safeRedirect();
        return;
      }

      alert("Konto utworzone. Sprawdź e-mail i kliknij link potwierdzający.");
      window.location.href = `/login${redirectQuery()}`;
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      alert("Błąd rejestracji.");
    } finally {
      setLoading(false);
    }
  }

  async function sendResetEmail() {
    if (!email.trim()) return alert("Wpisz adres e-mail.");

    try {
      setLoading(true);

      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      const recoveryUrl = isLocalhost
        ? `${window.location.origin}/reset-password`
        : "https://dreamsai.pl/reset-password";

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: recoveryUrl,
      });

      if (error) return alert(error.message);
      alert("Link do zmiany hasła został wysłany. Sprawdź też folder SPAM.");
    } catch (error) {
      console.error("RESET EMAIL ERROR:", error);
      alert("Błąd wysyłania linku.");
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword() {
    if (!newPassword) return alert("Wpisz nowe hasło.");
    if (newPassword.length < 6) return alert("Hasło musi mieć co najmniej 6 znaków.");

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return alert(error.message);

      await supabase.auth.signOut();
      alert("Hasło zostało zmienione. Zaloguj się ponownie.");
      window.location.href = "/login";
    } catch (error) {
      console.error("UPDATE PASSWORD ERROR:", error);
      alert("Błąd zmiany hasła.");
    } finally {
      setLoading(false);
    }
  }

  const title =
    mode === "register"
      ? "Załóż konto"
      : mode === "reset"
        ? "Ustaw nowe hasło"
        : "Zaloguj się";

  const description =
    mode === "register"
      ? "Utwórz konto DreamS AI i rozpocznij projekt swojej kuchni."
      : mode === "reset"
        ? "Wprowadź nowe hasło do swojego konta."
        : "Zaloguj się, aby przejść do swoich projektów kuchni.";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07090d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(216,170,76,0.16),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(59,130,246,0.10),transparent_28%)]" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <section className="hidden border-r border-white/10 px-10 py-14 lg:flex lg:flex-col lg:justify-between">
          <div>
            <Image src="/logo.png" alt="DreamS AI" width={240} height={80} priority className="h-auto w-[220px]" />

            <div className="mt-16 max-w-xl">
              <div className="inline-flex rounded-full border border-[#d8aa4c]/25 bg-[#d8aa4c]/10 px-5 py-3 text-sm font-semibold text-[#f0c56e]">
                Projekt kuchni z pomocą AI
              </div>

              <h1 className="mt-8 text-5xl font-black leading-tight tracking-tight">
                Zobacz swoją kuchnię
                <span className="block bg-gradient-to-r from-white via-[#f5ddb0] to-[#d8aa4c] bg-clip-text text-transparent">
                  zanim ją zamówisz
                </span>
              </h1>

              <p className="mt-7 text-lg leading-8 text-gray-400">
                Jedno konto daje dostęp do projektów, historii wersji, poprawek i płatności.
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600">© {new Date().getFullYear()} DreamS AI</p>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-xl">
            <div className="mb-8 flex justify-center lg:hidden">
              <Image src="/logo.png" alt="DreamS AI" width={220} height={80} priority className="h-auto w-[200px]" />
            </div>

            <div className="rounded-[32px] border border-white/10 bg-[#0c1016]/95 p-6 shadow-2xl sm:p-9">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d8aa4c]">DreamS AI</div>
              <h2 className="mt-4 text-3xl font-black sm:text-4xl">{title}</h2>
              <p className="mt-3 leading-7 text-gray-400">{description}</p>

              {mode === "reset" && !recoveryReady ? (
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-gray-300">
                  Przygotowywanie bezpiecznej zmiany hasła...
                </div>
              ) : (
                <div className="mt-8">
                  {mode === "reset" ? (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">Nowe hasło</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 znaków"
                        className="w-full rounded-2xl border border-white/10 bg-[#161b22] px-5 py-4 outline-none focus:border-[#d8aa4c]/70"
                      />
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Adres e-mail</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="np. kontakt@firma.pl"
                          className="w-full rounded-2xl border border-white/10 bg-[#161b22] px-5 py-4 outline-none focus:border-[#d8aa4c]/70"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Hasło</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (mode === "register") register();
                              else login();
                            }
                          }}
                          placeholder="Minimum 6 znaków"
                          className="w-full rounded-2xl border border-white/10 bg-[#161b22] px-5 py-4 outline-none focus:border-[#d8aa4c]/70"
                        />
                      </div>

                      {mode === "register" && (
                        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-gray-400">
                          <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="mt-1 h-4 w-4 accent-[#d8aa4c]"
                          />
                          <span>
                            Akceptuję{" "}
                            <Link href="/terms" target="_blank" className="font-semibold text-[#f0c56e] hover:underline">
                              Regulamin
                            </Link>{" "}
                            oraz{" "}
                            <Link href="/privacy-policy" target="_blank" className="font-semibold text-[#f0c56e] hover:underline">
                              Politykę prywatności
                            </Link>.
                          </span>
                        </label>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={loading}
                    onClick={mode === "register" ? register : mode === "reset" ? updatePassword : login}
                    className="mt-7 w-full rounded-2xl bg-gradient-to-r from-[#d8aa4c] to-[#f4ca73] px-6 py-4 text-lg font-bold text-black disabled:opacity-50"
                  >
                    {loading
                      ? "Ładowanie..."
                      : mode === "register"
                        ? "Zarejestruj się"
                        : mode === "reset"
                          ? "Zmień hasło"
                          : "Zaloguj się"}
                  </button>

                  {mode !== "reset" && (
                    <>
                      <div className="my-6 flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">lub</span>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>

                      <button
                        type="button"
                        disabled={loading}
                        onClick={signInWithGoogle}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white px-6 py-4 font-bold text-black transition hover:bg-gray-100 disabled:opacity-50"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M21.6 12.227c0-.709-.064-1.391-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.996 3.018v2.509h3.232c1.891-1.741 2.982-4.305 2.982-7.35Z" />
                          <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.041.955-3.386.955-2.605 0-4.809-1.759-5.595-4.123H3.064v2.591A9.997 9.997 0 0 0 12 22Z" />
                          <path fill="#FBBC05" d="M6.405 13.9A6.014 6.014 0 0 1 6.091 12c0-.659.114-1.3.314-1.9V7.509H3.064A9.997 9.997 0 0 0 2 12c0 1.614.386 3.141 1.064 4.491L6.405 13.9Z" />
                          <path fill="#EA4335" d="M12 5.977c1.468 0 2.786.505 3.823 1.495l2.864-2.863C16.959 2.995 14.695 2 12 2a9.997 9.997 0 0 0-8.936 5.509L6.405 10.1C7.191 7.736 9.395 5.977 12 5.977Z" />
                        </svg>
                        {mode === "register" ? "Zarejestruj się przez Google" : "Kontynuuj z Google"}
                      </button>
                    </>
                  )}

                  {mode === "login" && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={sendResetEmail}
                      className="mt-4 w-full rounded-2xl border border-white/10 px-6 py-4 font-semibold text-gray-300 hover:bg-white/5"
                    >
                      Wyślij link do resetu hasła
                    </button>
                  )}

                  {mode !== "reset" && (
                    <div className="mt-6 text-center text-sm">
                      <a
                        href={mode === "register" ? `/login${redirectQuery()}` : `/register${redirectQuery()}`}
                        className="font-semibold text-[#f0c56e] hover:text-white"
                      >
                        {mode === "register" ? "Masz konto? Zaloguj się" : "Nie masz konta? Załóż je"}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
