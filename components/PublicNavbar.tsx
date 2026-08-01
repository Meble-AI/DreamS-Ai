"use client";

import Image from "next/image";
import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

import {
  supabase,
} from "@/lib/supabase";

const routesWithoutPublicNavbar = [
  "/dashboard",
  "/projects",
  "/room-scanner",
];

export default function PublicNavbar() {
  const pathname =
    usePathname();

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const hideNavbar =
    routesWithoutPublicNavbar.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(
          `${route}/`
        )
    );

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (!active) return;

        setEmail(
          user?.email || ""
        );

      } catch (error) {
        console.log(
          "NAVBAR USER ERROR:",
          error
        );

      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUser();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session
        ) => {
          if (!active) return;

          setEmail(
            session?.user?.email || ""
          );

          setLoading(false);
        }
      );

    return () => {
      active = false;

      subscription.unsubscribe();
    };

  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function logout() {
    try {
      await supabase.auth.signOut();

      window.location.href =
        "/";

    } catch (error) {
      console.log(
        "LOGOUT ERROR:",
        error
      );
    }
  }

  if (hideNavbar) {
    return null;
  }

  return (
    <>
      <header
        className="
          fixed
          inset-x-0
          top-0
          z-50
          border-b
          border-white/10
          bg-[#07090d]/95
          backdrop-blur-xl
        "
      >
        <div
          className="
            mx-auto
            flex
            min-h-[88px]
            max-w-7xl
            items-center
            justify-between
            gap-5
            px-4
            sm:px-6
            lg:px-8
          "
        >
          <Link
            href="/"
            className="
              flex
              shrink-0
              items-center
            "
            aria-label="Projektuj AI"
          >
            <Image
              src="/logo.png"
              alt="Projektuj AI"
              width={210}
              height={70}
              priority
              className="
                h-auto
                w-[170px]
                sm:w-[205px]
              "
            />
          </Link>

          <nav
            className="
              hidden
              items-center
              gap-8
              md:flex
            "
          >
            <Link
              href="/"
              className="
                text-sm
                font-medium
                text-gray-300
                transition
                hover:text-[#f0c56e]
              "
            >
              Strona główna
            </Link>

            <Link
              href="/pricing"
              className="
                text-sm
                font-medium
                text-gray-300
                transition
                hover:text-[#f0c56e]
              "
            >
              Pakiety
            </Link>

            {!loading && email && (
              <Link
                href="/dashboard"
                className="
                  text-sm
                  font-medium
                  text-gray-300
                  transition
                  hover:text-[#f0c56e]
                "
              >
                Mój projekt
              </Link>
            )}
          </nav>

          <div
            className="
              hidden
              items-center
              gap-3
              md:flex
            "
          >
            {!loading && email ? (
              <>
                <div
                  className="
                    max-w-[220px]
                    truncate
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.04]
                    px-4
                    py-3
                    text-sm
                    text-gray-300
                  "
                >
                  {email}
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="
                    rounded-xl
                    border
                    border-[#d8aa4c]/60
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    transition
                    hover:bg-[#d8aa4c]
                    hover:text-black
                  "
                >
                  Wyloguj się
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-gray-200
                    transition
                    hover:text-[#f0c56e]
                  "
                >
                  Zaloguj się
                </Link>

                <Link
                  href="/register"
                  className="
                    rounded-xl
                    bg-gradient-to-r
                    from-[#d8aa4c]
                    to-[#f4ca73]
                    px-5
                    py-3
                    text-sm
                    font-bold
                    text-black
                    transition
                    hover:brightness-110
                  "
                >
                  Załóż konto
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setMobileOpen(
                (value) =>
                  !value
              )
            }
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-white/[0.04]
              md:hidden
            "
            aria-label="Otwórz menu"
          >
            <span
              className="
                text-2xl
                leading-none
              "
            >
              {
                mobileOpen
                  ? "×"
                  : "☰"
              }
            </span>
          </button>
        </div>

        {mobileOpen && (
          <div
            className="
              border-t
              border-white/10
              bg-[#090c11]
              px-4
              py-4
              md:hidden
            "
          >
            <div
              className="
                mx-auto
                flex
                max-w-7xl
                flex-col
                gap-2
              "
            >
              <Link
                href="/"
                className="
                  rounded-xl
                  px-4
                  py-3
                  text-gray-200
                  hover:bg-white/5
                "
              >
                Strona główna
              </Link>

              <Link
                href="/pricing"
                className="
                  rounded-xl
                  px-4
                  py-3
                  text-gray-200
                  hover:bg-white/5
                "
              >
                Pakiety
              </Link>

              {!loading && email ? (
                <>
                  <Link
                    href="/dashboard"
                    className="
                      rounded-xl
                      px-4
                      py-3
                      text-gray-200
                      hover:bg-white/5
                    "
                  >
                    Mój projekt
                  </Link>

                  <div
                    className="
                      truncate
                      px-4
                      py-2
                      text-sm
                      text-gray-500
                    "
                  >
                    {email}
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="
                      mt-2
                      rounded-xl
                      border
                      border-[#d8aa4c]/60
                      px-4
                      py-3
                      text-left
                      font-semibold
                    "
                  >
                    Wyloguj się
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="
                      rounded-xl
                      px-4
                      py-3
                      text-gray-200
                      hover:bg-white/5
                    "
                  >
                    Zaloguj się
                  </Link>

                  <Link
                    href="/register"
                    className="
                      mt-2
                      rounded-xl
                      bg-gradient-to-r
                      from-[#d8aa4c]
                      to-[#f4ca73]
                      px-4
                      py-3
                      text-center
                      font-bold
                      text-black
                    "
                  >
                    Załóż konto
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <div
        className="
          h-[88px]
        "
      />
    </>
  );
}