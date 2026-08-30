"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CookieConsent = "necessary" | "all";

const STORAGE_KEY = "dreamsai_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  function saveConsent(value: CookieConsent) {
    localStorage.setItem(STORAGE_KEY, value);
    localStorage.setItem("dreamsai_cookie_consent_date", new Date().toISOString());
    setVisible(false);

    window.dispatchEvent(
      new CustomEvent("dreamsai-cookie-consent", {
        detail: value,
      })
    );
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-5">
      <div className="mx-auto max-w-5xl rounded-[24px] border border-white/10 bg-[#0b0f14]/95 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-sm font-bold text-white">Twoja prywatność</div>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              DreamS AI korzysta z niezbędnych plików cookies potrzebnych do działania serwisu i logowania. Opcjonalne cookies analityczne lub marketingowe uruchamiamy dopiero po wyrażeniu zgody.
            </p>
            <Link
              href="/cookies"
              className="mt-2 inline-flex text-sm font-semibold text-[#f0c56e] transition hover:text-[#ffd98b]"
            >
              Dowiedz się więcej o cookies
            </Link>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => saveConsent("necessary")}
              className="rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
            >
              Tylko niezbędne
            </button>
            <button
              type="button"
              onClick={() => saveConsent("all")}
              className="rounded-xl bg-gradient-to-r from-[#d8aa4c] to-[#f4ca73] px-5 py-3 text-sm font-black text-black transition hover:brightness-110"
            >
              Akceptuję wszystkie
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
