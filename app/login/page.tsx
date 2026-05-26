"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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

          const accessToken =
            new URLSearchParams(
              hash.substring(1)
            ).get(
              "access_token"
            );

          const refreshToken =
            new URLSearchParams(
              hash.substring(1)
            ).get(
              "refresh_token"
            );

          if (
            accessToken &&
            refreshToken
          ) {

            await supabase.auth.setSession({

              access_token:
                accessToken,

              refresh_token:
                refreshToken,
            });

            setIsRecovery(true);
          }
        }

      } catch (err) {

        console.log(err);
      }
    }

    checkRecovery();

  }, []);

  async function login() {

    try {

      setLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({

          email,
          password,
        });

      if (error) {

        alert(error.message);

        return;
      }

      window.location.href =
        "/dashboard";

    } catch (err) {

      console.log(err);

      alert("Błąd logowania");

    } finally {

      setLoading(false);
    }
  }

  async function register() {

    try {

      setLoading(true);

      const { error } =
        await supabase.auth.signUp({

          email,
          password,
        });

      if (error) {

        alert(error.message);

        return;
      }

      alert(
        "Konto zostało utworzone 🙂 Sprawdź email."
      );

      window.location.href =
        "/login";

    } catch (err) {

      console.log(err);

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
        "Wpisz email do resetu hasła"
      );

      return;
    }

    try {

      const { error } =
        await supabase.auth.resetPasswordForEmail(

          email,

          {
            redirectTo:
              "https://dream-s-ai.vercel.app/login",
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

      console.log(err);

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

    try {

      setLoading(true);

      const { error } =
        await supabase.auth.updateUser({

          password:
            newPassword,
        });

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

      console.log(err);

      alert(
        "Błąd zmiany hasła"
      );

    } finally {

      setLoading(false);
    }
  }

  return (

    <main className="
      min-h-screen
      bg-black
      text-white
      flex
      items-center
      justify-center
      p-6
    ">

      <div className="
        w-full
        max-w-md
        bg-white/5
        border
        border-white/10
        backdrop-blur-2xl
        rounded-[40px]
        p-10
        shadow-2xl
      ">

        <div className="
          flex
          justify-center
          mb-8
        ">

          <Image
            src="/logo.png"
            alt="DreamS AI"
            width={220}
            height={80}
            priority
          />

        </div>

        <h1 className="
          text-5xl
          font-bold
          text-center
          mb-5
        ">

          {
            isRecovery
              ? "Ustaw nowe hasło"
              : isRegister
              ? "Załóż konto"
              : "Zaloguj się"
          }

        </h1>

        <p className="
          text-center
          text-gray-400
          mb-10
          leading-relaxed
        ">

          {
            isRecovery
              ? "Wprowadź nowe hasło do konta"
              : isRegister
              ? "Utwórz konto i rozpocznij projektowanie z AI"
              : "Zaloguj się do DreamS AI"
          }

        </p>

        {

          isRecovery ? (

            <input
              type="password"
              placeholder="Nowe hasło"

              value={newPassword}

              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }

              className="
                w-full
                p-5
                rounded-3xl
                bg-white
                text-black
                outline-none
              "
            />

          ) : (

            <div className="
              space-y-5
            ">

              <input
                type="email"
                placeholder="Email"

                value={email}

                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }

                className="
                  w-full
                  p-5
                  rounded-3xl
                  bg-white
                  text-black
                  outline-none
                "
              />

              <input
                type="password"
                placeholder="Hasło"

                value={password}

                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }

                className="
                  w-full
                  p-5
                  rounded-3xl
                  bg-white
                  text-black
                  outline-none
                "
              />

            </div>

          )
        }

        <button

          onClick={
            isRecovery
              ? updatePassword
              : isRegister
              ? register
              : login
          }

          disabled={loading}

          className="
            w-full
            mt-8
            bg-green-600
            hover:bg-green-500
            transition
            p-5
            rounded-3xl
            text-white
            font-bold
            text-xl
          "
        >

          {
            loading
              ? "Ładowanie..."
              : isRecovery
              ? "Zmień hasło"
              : isRegister
              ? "Zarejestruj się"
              : "Zaloguj się"
          }

        </button>

        {

          !isRecovery && (

            <div className="
              flex
              items-center
              justify-center
              gap-6
              mt-6
              text-sm
            ">

              <button

                onClick={resetPassword}

                className="
                  text-gray-400
                  hover:text-white
                  transition
                "
              >
                Reset hasła
              </button>

              <button

                onClick={() => {

                  if (isRegister) {

                    window.location.href =
                      "/login";

                  } else {

                    window.location.href =
                      "/register";
                  }
                }}

                className="
                  text-gray-400
                  hover:text-white
                  transition
                "
              >

                {
                  isRegister
                    ? "Logowanie"
                    : "Rejestracja"
                }

              </button>

            </div>

          )
        }

        <p className="
          text-center
          text-gray-500
          text-sm
          mt-10
          leading-relaxed
        ">
          Logując się akceptujesz
          regulamin, politykę prywatności
          oraz wykorzystanie plików cookies
          w serwisie DreamS AI.
        </p>

      </div>

    </main>
  );
}