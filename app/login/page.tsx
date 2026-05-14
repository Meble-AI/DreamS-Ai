"use client";

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
      flex
      items-center
      justify-center
      p-8
    ">

      <div className="
        w-full
        max-w-md
        bg-gray-900
        border
        border-gray-800
        rounded-3xl
        p-10
      ">

        <h1 className="
          text-5xl
          font-bold
          mb-3
          text-center
        ">
          DreamS AI
        </h1>

        <p className="
          text-gray-400
          text-center
          mb-10
        ">
          Logowanie do platformy AI
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
              bg-black
              border
              border-gray-700
              outline-none
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
              bg-black
              border
              border-gray-700
              outline-none
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

      </div>

    </main>
  );
}