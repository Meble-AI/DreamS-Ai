"use client";

import Image from "next/image";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

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

      window.location.href = "/";

    } catch (err) {

      console.log(err);

      alert("Błąd logowania");

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

  return (

    <main className="
      min-h-screen
      bg-black
      text-white
      grid
      lg:grid-cols-2
      overflow-hidden
    ">

      {/* LEWA STRONA */}

      <div className="
        relative
        hidden
        lg:flex
        flex-col
        justify-between
        p-16
      ">

        {/* TŁO */}

        <div
          className="
            absolute
            inset-0
            bg-cover
            bg-center
            opacity-60
          "
          style={{
            backgroundImage:
              "url('/bg.jpg')",
          }}
        />

        <div className="
          absolute
          inset-0
          bg-gradient-to-r
          from-black
          via-black/60
          to-transparent
        " />

        {/* CONTENT */}

        <div className="
          relative
          z-10
        ">

          <Image
            src="/logo.png"
            alt="DreamS AI"
            width={260}
            height={90}
            priority
            style={{
              width: "auto",
              height: "auto",
            }}
          />

          <div className="
            mt-16
            max-w-2xl
          ">

            <h1 className="
              text-7xl
              font-bold
              leading-[1.05]
              tracking-tight
            ">
              Projektuj
              <br />
              kuchnie
              <br />
              premium z
              <br />
              pomocą AI
            </h1>

            <p className="
              text-2xl
              text-gray-300
              mt-10
              leading-relaxed
            ">
              Generuj wizualizacje,
              wyceny i profesjonalne
              projekty mebli na wymiar
              w kilka minut.
            </p>

          </div>

        </div>

        {/* CHAT CARD */}

        <div className="
          relative
          z-10
          max-w-xl
          bg-white/10
          border
          border-white/10
          backdrop-blur-2xl
          rounded-[35px]
          p-8
          shadow-2xl
        ">

          <div className="
            text-lg
            mb-5
            text-gray-300
          ">
            DreamS AI
          </div>

          <div className="
            bg-black/40
            rounded-3xl
            p-6
            text-xl
            leading-relaxed
          ">
            Zaprojektuj nowoczesną
            kuchnię premium z wyspą,
            frontami kaszmir mat,
            oświetleniem LED i
            zabudową pod sufit.
          </div>

          <div className="
            mt-6
            bg-green-600/30
            border
            border-green-500/30
            rounded-3xl
            p-5
            text-lg
            leading-relaxed
          ">
            ✓ Wizualizacja gotowa
            <br />
            ✓ Wycena wygenerowana
          </div>

        </div>

      </div>

      {/* PRAWA STRONA */}

      <div className="
        flex
        items-center
        justify-center
        p-6
        relative
        overflow-hidden
      ">

        {/* GLOW */}

        <div className="
          absolute
          top-0
          right-0
          w-[500px]
          h-[500px]
          bg-blue-600/20
          blur-[160px]
          rounded-full
        " />

        <div className="
          absolute
          bottom-0
          left-0
          w-[400px]
          h-[400px]
          bg-purple-600/20
          blur-[160px]
          rounded-full
        " />

        {/* LOGIN CARD */}

        <div className="
          relative
          z-10
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

          {/* LOGO */}

          <div className="
            flex
            justify-center
            mb-8
          ">

            <Image
              src="/logo.png"
              alt="DreamS AI"
              width={240}
              height={90}
              priority
              style={{
                width: "auto",
                height: "auto",
              }}
            />

          </div>

          {/* HEADER */}

          <h2 className="
            text-5xl
            font-bold
            text-center
            mb-5
          ">
            Witaj ponownie
          </h2>

          <p className="
            text-center
            text-gray-400
            text-lg
            mb-10
            leading-relaxed
          ">
            DreamS AI — platforma AI
            dla producentów mebli premium
          </p>

          {/* INPUTS */}

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
                text-lg
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
                text-lg
              "
            />

          </div>

          {/* LOGIN */}

          <button

            onClick={login}

            disabled={loading}

            className="
              w-full
              mt-8
              bg-green-600
              hover:bg-green-500
              transition
              text-white
              p-5
              rounded-3xl
              font-bold
              text-2xl
              shadow-2xl
            "
          >

            {
              loading
                ? "Logowanie..."
                : "Zaloguj się"
            }

          </button>

          {/* LINKS */}

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

              className="
                text-gray-400
                hover:text-white
                transition
              "
            >
              Rejestracja
            </button>

          </div>

          {/* FOOTER */}

          <p className="
            text-center
            text-gray-500
            text-sm
            mt-10
            leading-relaxed
          ">
            Logując się akceptujesz
            politykę prywatności,
            pliki cookies oraz
            regulamin platformy
            DreamS AI.
          </p>

        </div>

      </div>

    </main>
  );
}