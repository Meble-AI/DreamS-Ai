"use client";

import Image from "next/image";
import {
  useEffect,
  useState,
} from "react";
import {
  usePathname,
} from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const pathname =
    usePathname();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [isRecovery, setIsRecovery] =
    useState(
      pathname === "/reset-password"
    );

  const [isRegister, setIsRegister] =
    useState(
      pathname === "/register"
    );

  function getRedirectPath() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const redirect =
      params.get("redirect");

    // Zabezpieczenie przed przekierowaniem
    // na zewnętrzną stronę.
    if (
      redirect &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//")
    ) {
      return redirect;
    }

    return "/dashboard";
  }

  function getRedirectQuery() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const redirect =
      params.get("redirect");

    if (
      redirect &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//")
    ) {
      return `?redirect=${encodeURIComponent(
        redirect
      )}`;
    }

    return "";
  }

  useEffect(() => {
    async function checkRecovery() {
      try {
        const hash =
          window.location.hash;

        if (
          hash.includes(
            "access_token"
          )
        ) {
          const hashParams =
            new URLSearchParams(
              hash.substring(1)
            );

          const accessToken =
            hashParams.get(
              "access_token"
            );

          const refreshToken =
            hashParams.get(
              "refresh_token"
            );

          if (
            accessToken &&
            refreshToken
          ) {
            const { error } =
              await supabase.auth.setSession(
                {
                  access_token:
                    accessToken,

                  refresh_token:
                    refreshToken,
                }
              );

            if (error) {
              console.error(
                "SET SESSION ERROR:",
                error
              );

              return;
            }

            setIsRecovery(true);
          }
        }
      } catch (err) {
        console.error(
          "RECOVERY ERROR:",
          err
        );
      }
    }

    checkRecovery();
  }, []);

  async function login() {
    if (!email || !password) {
      alert(
        "Wpisz adres e-mail i hasło."
      );

      return;
    }

    try {
      setLoading(true);

      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email,
            password,
          }
        );

      if (error) {
        alert(error.message);

        return;
      }

      if (!data.session) {
        alert(
          "Nie udało się utworzyć sesji logowania."
        );

        return;
      }

      const redirectPath =
        getRedirectPath();

      window.location.href =
        redirectPath;
    } catch (err) {
      console.error(
        "LOGIN ERROR:",
        err
      );

      alert("Błąd logowania");
    } finally {
      setLoading(false);
    }
  }

  async function register() {
    if (!email || !password) {
      alert(
        "Wpisz adres e-mail i hasło."
      );

      return;
    }

    if (password.length < 6) {
      alert(
        "Hasło musi mieć co najmniej 6 znaków."
      );

      return;
    }

    try {
      setLoading(true);

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (error) {
        alert(error.message);

        return;
      }

      // Jeżeli Supabase od razu zalogował
      // użytkownika, wracamy do cennika.
      if (data.session) {
        window.location.href =
          getRedirectPath();

        return;
      }

      alert(
        "Konto zostało utworzone 🙂 Sprawdź e-mail i potwierdź konto, a następnie się zaloguj."
      );

      window.location.href =
        `/login${getRedirectQuery()}`;
    } catch (err) {
      console.error(
        "REGISTER ERROR:",
        err
      );

      alert(
        "Błąd rejestracji"
      );
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
    if (!email) {
      alert(
        "Wpisz e-mail do resetu hasła"
      );

      return;
    }

    try {
      const { error } =
        await supabase.auth
          .resetPasswordForEmail(
            email,
            {
              redirectTo:
                "https://dreamsai.pl/reset-password",
            }
          );

      if (error) {
        alert(error.message);

        return;
      }

      alert(
        "Link do resetu hasła został wysłany 🙂"
      );
    } catch (err) {
      console.error(
        "RESET PASSWORD ERROR:",
        err
      );

      alert(
        "Błąd resetowania hasła"
      );
    }
  }

  async function updatePassword() {
    if (!newPassword) {
      alert(
        "Wpisz nowe hasło"
      );

      return;
    }

    if (newPassword.length < 6) {
      alert(
        "Hasło musi mieć co najmniej 6 znaków."
      );

      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.updateUser(
          {
            password:
              newPassword,
          }
        );

      if (error) {
        alert(error.message);

        return;
      }

      alert(
        "Hasło zostało zmienione 🙂"
      );

      window.location.href =
        "/login";
    } catch (err) {
      console.error(
        "UPDATE PASSWORD ERROR:",
        err
      );

      alert(
        "Błąd zmiany hasła"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07090d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(216,170,76,0.16),transparent_32%),radial-gradient(circle_at_85%_80%,rgba(59,130,246,0.10),transparent_28%)]" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        {/* LEWA STRONA */}
        <section className="hidden border-r border-white/10 px-10 py-14 lg:flex lg:flex-col lg:justify-between">
          <div>
            <Image
              src="/logo.png"
              alt="Projektuj AI"
              width={240}
              height={80}
              priority
              className="h-auto w-[220px]"
            />

            <div className="mt-16 max-w-xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#d8aa4c]/25 bg-[#d8aa4c]/10 px-5 py-3 text-sm font-semibold text-[#f0c56e]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f0c56e] shadow-[0_0_16px_rgba(240,197,110,0.8)]" />
                Projektowanie wnętrz z pomocą AI
              </div>

              <h1 className="mt-8 text-5xl font-black leading-tight tracking-tight">
                Zaloguj się i wróć do
                <span className="block bg-gradient-to-r from-white via-[#f5ddb0] to-[#d8aa4c] bg-clip-text text-transparent">
                  swojego projektu
                </span>
              </h1>

              <p className="mt-7 text-lg leading-8 text-gray-400">
                Twórz realistyczne wizualizacje, zapisuj kolejne wersje i
                wprowadzaj poprawki dokładnie tak, jak podczas rozmowy z
                projektantem.
              </p>

              <div className="mt-10 grid gap-4">
                {[
                  "Fotorealistyczne wizualizacje",
                  "AI Skaner pomieszczeń",
                  "Historia wersji projektu",
                  "Poprawki na podstawie uwag klienta",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8aa4c]/10 text-[#f0c56e]">
                      ✓
                    </div>

                    <span className="font-medium text-gray-200">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Projektuj AI
          </p>
        </section>

        {/* FORMULARZ */}
        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-xl">
            <div className="mb-8 flex justify-center lg:hidden">
              <Image
                src="/logo.png"
                alt="Projektuj AI"
                width={220}
                height={80}
                priority
                className="h-auto w-[200px]"
              />
            </div>

            <div className="rounded-[32px] border border-white/10 bg-[#0c1016]/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-9">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d8aa4c]">
                Projektuj AI
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                {isRecovery
                  ? "Ustaw nowe hasło"
                  : isRegister
                    ? "Załóż konto"
                    : "Zaloguj się"}
              </h2>

              <p className="mt-3 leading-7 text-gray-400">
                {isRecovery
                  ? "Wprowadź nowe hasło do swojego konta."
                  : isRegister
                    ? "Utwórz konto i rozpocznij projektowanie wnętrza z AI."
                    : "Zaloguj się, aby przejść do swoich projektów."}
              </p>

              <div className="mt-8">
                {isRecovery ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Nowe hasło
                    </label>

                    <input
                      type="password"
                      placeholder="Minimum 6 znaków"
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(
                          e.target.value
                        )
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#161b22] px-5 py-4 text-white outline-none placeholder:text-gray-600 focus:border-[#d8aa4c]/70"
                    />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Adres e-mail
                      </label>

                      <input
                        type="email"
                        placeholder="np. kontakt@firma.pl"
                        value={email}
                        onChange={(e) =>
                          setEmail(
                            e.target.value
                          )
                        }
                        className="w-full rounded-2xl border border-white/10 bg-[#161b22] px-5 py-4 text-white outline-none placeholder:text-gray-600 focus:border-[#d8aa4c]/70"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-300">
                        Hasło
                      </label>

                      <input
                        type="password"
                        placeholder="Wpisz hasło"
                        value={password}
                        onChange={(e) =>
                          setPassword(
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter"
                          ) {
                            if (isRegister) {
                              register();
                            } else {
                              login();
                            }
                          }
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-[#161b22] px-5 py-4 text-white outline-none placeholder:text-gray-600 focus:border-[#d8aa4c]/70"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={
                    isRecovery
                      ? updatePassword
                      : isRegister
                        ? register
                        : login
                  }
                  disabled={loading}
                  className="mt-7 w-full rounded-2xl bg-gradient-to-r from-[#d8aa4c] to-[#f4ca73] px-6 py-4 text-lg font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Ładowanie..."
                    : isRecovery
                      ? "Zmień hasło"
                      : isRegister
                        ? "Zarejestruj się"
                        : "Zaloguj się"}
                </button>

                {!isRecovery && (
                  <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={resetPassword}
                      className="text-left text-gray-400 transition hover:text-[#f0c56e]"
                    >
                      Nie pamiętasz hasła?
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const redirectQuery =
                          getRedirectQuery();

                        if (isRegister) {
                          window.location.href =
                            `/login${redirectQuery}`;
                        } else {
                          window.location.href =
                            `/register${redirectQuery}`;
                        }
                      }}
                      className="text-left font-semibold text-[#f0c56e] transition hover:text-white"
                    >
                      {isRegister
                        ? "Masz konto? Zaloguj się"
                        : "Nie masz konta? Załóż je"}
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-8 border-t border-white/10 pt-6 text-center text-xs leading-6 text-gray-600">
                Logując się, akceptujesz regulamin, politykę prywatności oraz
                wykorzystanie plików cookies w serwisie Projektuj AI.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}