"use client";

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

  useEffect(() => {

    async function getUser() {

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session) {

        window.location.href =
          "/login";

        return;
      }

      if (
        session.user.email
      ) {

        setEmail(
          session.user.email
        );
      }
    }

    getUser();

  }, []);

  async function logout() {

    await supabase.auth.signOut();

    window.location.href =
      "/login";
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
    ">

      <div className="
        max-w-6xl
        mx-auto
        p-8
      ">

        <div className="
          flex
          justify-between
          items-center
          mb-10
        ">

          <div>

            <h1 className="
              text-5xl
              font-bold
            ">
              DreamS AI
            </h1>

            <p className="
              text-gray-400
              mt-3
              text-lg
            ">
              Projektowanie mebli premium
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
                bg-blue-600
                hover:bg-blue-700
                transition
                px-6
                py-3
                rounded-2xl
                font-bold
              "
            >
              Moje projekty
            </button>

            <button

              onClick={logout}

              className="
                bg-red-600
                hover:bg-red-700
                transition
                px-6
                py-3
                rounded-2xl
                font-bold
              "
            >
              Wyloguj
            </button>

          </div>

        </div>

        <div className="
          grid
          grid-cols-2
          md:grid-cols-4
          gap-4
          mb-6
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
              p-4
              rounded-2xl
              bg-gray-900
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
              p-4
              rounded-2xl
              bg-gray-900
            "
          />

          <input
            placeholder="Email"

            value={email}

            disabled

            className="
              p-4
              rounded-2xl
              bg-gray-800
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
              p-4
              rounded-2xl
              bg-gray-900
            "
          />

        </div>

        <div className="
          space-y-8
          mb-8
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
                  bg-gray-900
                  p-6
                  rounded-3xl
                ">

                  <div className="
                    text-sm
                    text-gray-400
                    mb-2
                  ">
                    Klient
                  </div>

                  <div className="
                    whitespace-pre-wrap
                  ">
                    {item.user}
                  </div>

                </div>

                <div className="
                  bg-blue-600
                  p-6
                  rounded-3xl
                ">

                  <div className="
                    text-sm
                    text-blue-100
                    mb-2
                  ">
                    AI Projektant
                  </div>

                  <div className="
                    whitespace-pre-wrap
                    leading-8
                  ">
                    {item.ai}
                  </div>

                  {item.generatedImage && (

                    <img
                      src={`data:image/png;base64,${item.generatedImage}`}
                      alt="wizualizacja"

                      className="
                        mt-6
                        rounded-2xl
                        w-full
                      "
                    />

                  )}

                </div>

              </div>
            )
          )}

          {loading && (

            <div className="
              bg-gray-900
              rounded-3xl
              p-10
              flex
              flex-col
              items-center
              justify-center
              gap-6
            ">

              <div className="
                w-16
                h-16
                border-4
                border-white
                border-t-transparent
                rounded-full
                animate-spin
              " />

              <div className="
                text-2xl
                font-semibold
              ">
                AI projektuje kuchnię...
              </div>

              <div className="
                text-gray-400
              ">
                Tworzenie wizualizacji i wyceny
              </div>

            </div>

          )}

        </div>

        <div className="
          mb-4
        ">

          <input
            type="file"

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

            className="
              mb-4
            "
          />

        </div>

        <div className="
          flex
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
              Opisz swoją kuchnię...
            "

            className="
              flex-1
              p-5
              rounded-3xl
              bg-gray-900
              text-white
              outline-none
            "
          />

          <button

            onClick={sendMessage}

            disabled={loading}

            className={`
              px-10
              rounded-3xl
              font-bold
              transition

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

    </main>
  );
}