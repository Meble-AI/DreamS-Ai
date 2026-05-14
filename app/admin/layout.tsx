"use client";

import { useState }
from "react";

export default function AdminLayout({

  children,

}: {

  children: React.ReactNode;

}) {

  const [authorized, setAuthorized] =
    useState(false);

  const [password, setPassword] =
    useState("");

  function login() {

    if (
      password === "meble123"
    ) {

      setAuthorized(true);
    }
  }

  if (!authorized) {

    return (

      <main className="
        min-h-screen
        bg-black
        text-white
        flex
        items-center
        justify-center
      ">

        <div className="
          bg-gray-900
          p-10
          rounded-3xl
          border
          border-gray-800
          w-full
          max-w-md
        ">

          <h1 className="
            text-3xl
            font-bold
            mb-6
          ">
            Panel Admina
          </h1>

          <input

            type="password"

            placeholder="
              Hasło administratora
            "

            value={password}

            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }

            className="
              w-full
              p-4
              rounded-2xl
              bg-black
              border
              border-gray-700
              mb-4
            "
          />

          <button

            onClick={login}

            className="
              w-full
              bg-white
              text-black
              p-4
              rounded-2xl
              font-bold
            "
          >
            Zaloguj
          </button>

        </div>

      </main>
    );
  }

  return (
    <>
      {children}
    </>
  );
}