"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {

  const [visible, setVisible] =
    useState(false);

  useEffect(() => {

    const accepted =
      localStorage.getItem(
        "cookiesAccepted"
      );

    if (!accepted) {

      setVisible(true);
    }

  }, []);

  function acceptCookies() {

    localStorage.setItem(
      "cookiesAccepted",
      "true"
    );

    setVisible(false);
  }

  if (!visible) {

    return null;
  }

  return (

    <div
      className="
        fixed
        bottom-6
        left-1/2
        -translate-x-1/2
        z-50
        bg-zinc-900
        border
        border-white/10
        rounded-3xl
        px-6
        py-4
        flex
        items-center
        gap-5
        shadow-2xl
      "
    >

      <p
        className="
          text-sm
          text-gray-300
        "
      >
        Ta strona używa plików cookies
        w celu poprawy działania serwisu.
      </p>

      <button

        onClick={acceptCookies}

        className="
          bg-green-600
          hover:bg-green-500
          transition
          px-4
          py-2
          rounded-xl
          text-white
          font-semibold
        "
      >
        OK
      </button>

    </div>
  );
}