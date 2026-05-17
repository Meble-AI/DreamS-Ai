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

  const [isRegister, setIsRegister] =
    useState(false);

  async function handleAuth() {

    try {

      setLoading(true);

      if (isRegister) {

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
          "Konto zostało utworzone 🙂"
        );

      } else {

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
      }

    } catch (err) {

      console.log(err);

      alert(
        "Wystąpił błąd logowania"
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
      grid
      lg:grid-cols-2
    ">

      {/* LEFT SIDE */}

      <div className="
        relative
        hidden
        lg:flex
        items-center
        justify-center
        overflow-hidden
      ">

        <Image
          src="/kitchen-login.jpg"
          alt="Kitchen"
          fill
          priority
          sizes="50vw"
          className="
            object-cover
            opacity-50
          "
        />

        <div className="
          absolute
          inset-0
          bg-gradient-to-br
          from-black/80
          via-black/40
          to-black
        " />

        <div className="
          relative
          z-10
          max-w-xl
          p-12
        ">

          <Image
            src="/logo.png"
            alt="DreamS AI"
            width={220}
            height={80}
            style={{
              width: "auto",
              height: "auto",
            }}
            className="
              mb-10
            "
          />

          <h1 className="
            text-6xl
            font-bold
            leading-tight
            mb-8
          ">
            Projektuj
            kuchnie premium
            z pomocą AI
          </h1>

          <p className="
            text-xl
            text-gray-300
            leading-relaxed
          ">
            Generuj wizualizacje,
            wyceny i profesjonalne
            projekty mebli na wymiar
            w kilka minut.
          </p>

          {/* FLOATING CHAT */}

          <div className="
            mt-12
            backdrop-blur-xl
            bg-white/10
            border
            border-white/10
            rounded-3xl
            p-6
            shadow-2xl
            max-w-md
          ">

            <div className="
              text-sm
              text-gray-300
              mb-3
            ">
              DreamS AI
            </div>

            <div className="
              bg-black/40
              rounded-2xl
              p-4
              text-sm
              leading-relaxed
              text-gray-200
            ">
              Zaprojektuj nowoczesną
              kuchnię premium z wyspą,
              frontami kaszmir mat,
              oświetleniem LED i
              zabudową pod sufit.
            </div>

            <div className="
              mt-4
              bg-green-500/20
              border
              border-green-500/20
              rounded-2xl
              p-4
              text-sm
              text-green-200
            ">
              ✓ Wizualizacja gotowa
              <br />
              ✓ Wycena wygenerowana
            </div>

          </div>

        </div>

      </div>

      {/* RIGHT SIDE */}

      <div className="
        flex
        items-center
        justify-center
        p-8
      ">

        <div className="
          w-full
          max-w-md
          backdrop-blur-2xl
          bg-white/5
          border
          border-white/10
          rounded-3xl
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
              width={180}
              height={60}
              style={{
                width: "auto",
                height: "auto",
              }}
            />

          </div>

          <h2 className="
            text-4xl
            font-bold
            mb-3
            text-center
          ">
            {isRegister
              ? "Utwórz konto"
              : "Witaj ponownie"}
          </h2>

          <p className="
            text-gray-400
            text-center
            mb-10
          ">
            DreamS AI —
            platforma AI dla
            producentów mebli premium
          </p>

          <div className="
            space-y-4
          ">

            <input

              type="email"

              placeholder="Email"

              value={email}

              onChange={(e) =>
                setEmail(e.target.value)
              }

              className="
                w-full
                p-4
                rounded-2xl
                bg-black/40
                border
                border-white/10
                outline-none
                focus:border-green-500
                transition
              "
            />

            <input

              type="password"

              placeholder="Hasło"

              value={password}

              onChange={(e) =>
                setPassword(e.target.value)
              }

              className="
                w-full
                p-4
                rounded-2xl
                bg-black/40
                border
                border-white/10
                outline-none
                focus:border-green-500
                transition
              "
            />

          </div>

          <button

            onClick={handleAuth}

            disabled={loading}

            className="
              w-full
              mt-6
              bg-green-600
              hover:bg-green-700
              transition
              p-4
              rounded-2xl
              font-bold
              text-lg
              shadow-lg
              shadow-green-500/20
            "
          >
            {loading
              ? "Ładowanie..."
              : isRegister
              ? "Zarejestruj się"
              : "Zaloguj się"}
          </button>

          <button

            onClick={() =>
              setIsRegister(
                !isRegister
              )
            }

            className="
              w-full
              mt-4
              text-gray-400
              hover:text-white
              transition
            "
          >
            {isRegister
              ? "Masz już konto? Zaloguj się"
              : "Nie masz konta? Zarejestruj się"}
          </button>

          <p className="
            text-xs
            text-gray-500
            text-center
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