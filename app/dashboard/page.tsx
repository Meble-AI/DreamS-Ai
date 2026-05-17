"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {

  const [message, setMessage] =
    useState("");

  const [chat, setChat] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [image, setImage] =
    useState<string | null>(null);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [city, setCity] =
    useState("");

  const [email, setEmail] =
    useState("");

  /* STABILNY AUTH */

  useEffect(() => {

    async function getUser() {

      try {

        const {
          data,
          error,
        } =
          await supabase.auth.getUser();

        if (error) {

          console.log(error);

          return;
        }

        if (
          data?.user?.email
        ) {

          setEmail(
            data.user.email
          );
        }

      } catch (err) {

        console.log(err);
      }
    }

    getUser();

  }, []);

  async function logout() {

    try {

      await supabase.auth.signOut();

      window.location.href =
        "/login";

    } catch (err) {

      console.log(err);
    }
  }

  async function sendMessage() {

    if (loading) return;

    if (!name.trim()) {

      alert(
        "Podaj imię"
      );

      return;
    }

    if (!phone.trim()) {

      alert(
        "Podaj telefon"
      );

      return;
    }

    if (!city.trim()) {

      alert(
        "Podaj miejscowość"
      );

      return;
    }

    if (!message.trim()) {

      alert(
        "Wpisz wiadomość"
      );

      return;
    }

    setLoading(true);

    try {

      const res =
        await fetch(
          "/api/chat",

          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              message,
              history: chat,

              name,
              phone,
              city,
              email,

              image,
            }),
          }
        );

      const data =
        await res.json();

      if (!data.success) {

        alert(
          "Błąd AI"
        );

        setLoading(false);

        return;
      }

      const newItem = {

        user:
          message,

        ai:
          data.reply,

        generatedImage:
          data.generatedImage,
      };

      const updatedChat = [

        ...chat,
        newItem,
      ];

      setChat(
        updatedChat
      );

      /* ZAPIS PROJEKTU */

      if (email) {

        await supabase

          .from("projects")

          .insert([

            {
              user_email:
                email,

              project_name:
                "Projekt kuchni",

              room_type:
                "kuchnia",

              conversation:
                updatedChat,

              generated_image:
                data.generatedImage,
            },
          ]);
      }

      setMessage("");
      setImage(null);

    } catch (err) {

      console.log(err);

      alert(
        "Błąd połączenia z AI"
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
      relative
      overflow-hidden
    ">

      {/* BACKGROUND */}

      <div
        className="
          absolute
          inset-0
          opacity-10
          bg-cover
          bg-center
          bg-no-repeat
        "
        style={{
          backgroundImage:
            "url('/bg.jpg')",
        }}
      />

      {/* GLOW */}

      <div className="
        absolute
        top-0
        left-0
        w-[700px]
        h-[700px]
        bg-blue-600/20
        blur-[180px]
        rounded-full
      " />

      <div className="
        absolute
        bottom-0
        right-0
        w-[600px]
        h-[600px]
        bg-purple-600/20
        blur-[180px]
        rounded-full
      " />

      <div className="
        absolute
        inset-0
        bg-gradient-to-br
        from-black
        via-black/90
        to-blue-950/40
      " />

      <div className="
        relative
        z-10
        max-w-7xl
        mx-auto
        p-6
        lg:p-10
      ">

        {/* TOPBAR */}

        <div className="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-6
          mb-10
        ">

          <div>

            <Image
              src="/logo.png"
              alt="DreamS AI"
              width={220}
              height={80}
              priority
              style={{
                width: "auto",
                height: "auto",
              }}
              className="
                mb-4
              "
            />

            <h1 className="
              text-5xl
              lg:text-6xl
              font-bold
              leading-tight
            ">
              DreamS AI Studio
            </h1>

            <p className="
              text-gray-400
              text-xl
              mt-4
              max-w-2xl
            ">
              Projektuj meble premium
              z pomocą sztucznej inteligencji.
            </p>

          </div>

          <div className="
            flex
            gap-4
          ">

            <button

              onClick={() =>
                window.location.href =
                  "/projects"
              }

              className="
                backdrop-blur-xl
                bg-blue-600/80
                hover:bg-blue-600
                transition
                px-6
                py-4
                rounded-2xl
                font-bold
                shadow-lg
              "
            >
              Moje projekty
            </button>

            <button

              onClick={logout}

              className="
                backdrop-blur-xl
                bg-red-600/80
                hover:bg-red-600
                transition
                px-6
                py-4
                rounded-2xl
                font-bold
                shadow-lg
              "
            >
              Wyloguj
            </button>

          </div>

        </div>

        {/* USER DATA */}

        <div className="
          grid
          md:grid-cols-2
          lg:grid-cols-4
          gap-4
          mb-10
        ">

          <input
            placeholder="Imię"
            value={name}
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            className="
              p-5
              rounded-3xl
              bg-white/5
              border
              border-white/10
              backdrop-blur-xl
              outline-none
              focus:border-green-500
            "
          />

          <input
            placeholder="Telefon"
            value={phone}
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            className="
              p-5
              rounded-3xl
              bg-white/5
              border
              border-white/10
              backdrop-blur-xl
              outline-none
              focus:border-green-500
            "
          />

          <input
            placeholder="Email"
            value={email}
            disabled
            className="
              p-5
              rounded-3xl
              bg-white/5
              border
              border-white/10
              backdrop-blur-xl
              text-gray-400
            "
          />

          <input
            placeholder="Miejscowość"
            value={city}
            onChange={(e) =>
              setCity(
                e.target.value
              )
            }
            className="
              p-5
              rounded-3xl
              bg-white/5
              border
              border-white/10
              backdrop-blur-xl
              outline-none
              focus:border-green-500
            "
          />

        </div>

        {/* CHAT */}

        <div className="
          space-y-8
          mb-10
        ">

          {chat.map(
            (
              item,
              index
            ) => (

              <div
                key={index}
                className="
                  space-y-4
                "
              >

                <div className="
                  bg-white/5
                  border
                  border-white/10
                  backdrop-blur-xl
                  p-6
                  rounded-3xl
                ">

                  <div className="
                    text-sm
                    text-gray-400
                    mb-3
                  ">
                    Klient
                  </div>

                  <div className="
                    whitespace-pre-wrap
                    leading-8
                  ">
                    {item.user}
                  </div>

                </div>

                <div className="
                  bg-gradient-to-br
                  from-blue-600/80
                  to-indigo-900/80
                  border
                  border-white/10
                  backdrop-blur-xl
                  p-6
                  rounded-3xl
                  shadow-2xl
                ">

                  <div className="
                    text-sm
                    text-blue-100
                    mb-3
                  ">
                    DreamS AI
                  </div>

                  <div className="
                    whitespace-pre-wrap
                    leading-8
                  ">
                    {item.ai}
                  </div>

                  {item.generatedImage && (

                    <div className="
                      mt-8
                    ">

                      <img
                        src={`data:image/png;base64,${item.generatedImage}`}
                        alt="wizualizacja"
                        className="
                          rounded-3xl
                          w-full
                          shadow-2xl
                        "
                      />

                    </div>

                  )}

                </div>

              </div>
            )
          )}

          {loading && (

            <div className="
              bg-white/5
              border
              border-white/10
              backdrop-blur-xl
              rounded-3xl
              p-12
              flex
              flex-col
              items-center
              justify-center
              gap-6
            ">

              <div className="
                w-20
                h-20
                border-4
                border-white
                border-t-transparent
                rounded-full
                animate-spin
              " />

              <div className="
                text-3xl
                font-bold
              ">
                DreamS AI pracuje...
              </div>

              <div className="
                text-gray-400
                text-lg
              ">
                Tworzenie wizualizacji i wyceny
              </div>

            </div>

          )}

        </div>

        {/* INPUT */}

        <div className="
          bg-white/5
          border
          border-white/10
          backdrop-blur-xl
          rounded-[40px]
          p-5
          shadow-2xl
        ">

          <label
            className="
              flex
              items-center
              justify-center
              gap-3
              p-5
              rounded-3xl
              border
              border-dashed
              border-white/20
              bg-black/20
              backdrop-blur-xl
              cursor-pointer
              hover:border-green-500
              transition
              text-gray-300
              mb-5
            "
          >

            <span className="
              text-2xl
            ">
              📎
            </span>

            <span>
              {
                image
                  ? "Zdjęcie zostało dodane"
                  : "Dodaj zdjęcie inspiracji lub projektu"
              }
            </span>

            <input
              type="file"
              hidden

              onChange={(e) => {

                const file =
                  e.target.files?.[0];

                if (!file) return;

                const reader =
                  new FileReader();

                reader.onloadend = () => {

                  setImage(
                    String(
                      reader.result
                    )
                  );
                };

                reader.readAsDataURL(
                  file
                );
              }}
            />

          </label>

          <div className="
            flex
            flex-col
            lg:flex-row
            gap-4
          ">

            <input
              value={message}
              onChange={(e) =>
                setMessage(
                  e.target.value
                )
              }
              placeholder="
                Opisz swoją kuchnię premium...
              "
              className="
                flex-1
                p-6
                rounded-3xl
                bg-black/30
                border
                border-white/10
                text-white
                outline-none
                text-lg
              "
            />

            <button

              onClick={sendMessage}

              disabled={loading}

              className={`
                px-10
                py-6
                rounded-3xl
                font-bold
                text-lg
                transition
                shadow-2xl

                ${
                  loading
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-white text-black hover:scale-105"
                }
              `}
            >

              {
                loading
                  ? "AI pracuje..."
                  : "Wyślij"
              }

            </button>

          </div>

        </div>

      </div>

    </main>
  );
}