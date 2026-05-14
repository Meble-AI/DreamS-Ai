"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";

export default function Home() {

  // =========================
  // STATES
  // =========================

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [hasAccess, setHasAccess] =
    useState(false);

  const [projectId, setProjectId] =
    useState<string | null>(null);

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

  const [email, setEmail] =
    useState("");

  const [city, setCity] =
    useState("");

  // =========================
  // AUTH
  // =========================

  useEffect(() => {

    async function checkUser() {

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session) {

        window.location.href =
          "/login";

        return;
      }

      const userEmail =
        session.user.email || "";

      setEmail(userEmail);

      const { data } =
        await supabase

          .from("subscriptions")

          .select("*")

          .eq(
            "email",
            userEmail
          )

          .eq(
            "active",
            true
          );

      if (
        data &&
        data.length > 0
      ) {

        setHasAccess(true);
      }

      setCheckingAuth(false);
    }

    checkUser();

  }, []);

  // =========================
  // LOGOUT
  // =========================

  async function logout() {

    await supabase.auth.signOut();

    window.location.href =
      "/login";
  }

  // =========================
  // STRIPE
  // =========================

  async function buyPro(
    plan: string
  ) {

    try {

      const res =
        await fetch(
          "/api/checkout",

          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              email,
              plan,
            }),
          }
        );

      const data =
        await res.json();

      if (data.url) {

        window.location.href =
          data.url;

      } else {

        alert(
          "Stripe nie zwrócił URL"
        );
      }

    } catch (err) {

      console.log(err);

      alert(
        "Błąd Stripe"
      );
    }
  }

  // =========================
  // SEND MESSAGE
  // =========================

  async function sendMessage() {

    if (!message && !image) return;

    setLoading(true);

    try {

      let currentProjectId =
        projectId;

      // =========================
      // CREATE PROJECT
      // =========================

      if (!currentProjectId) {

        const { data } =
          await supabase

            .from("projects")

            .insert([

              {
                user_email:
                  email,

                project_name:
                  "Nowy projekt kuchni",

                room_type:
                  "kuchnia",
              },
            ])

            .select()

            .single();

        if (data) {

          currentProjectId =
            data.id;

          setProjectId(
            data.id
          );
        }
      }

      // =========================
      // AI REQUEST
      // =========================

      const res =
        await fetch("/api/chat", {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            message,
            image,
            history: chat,

            name,
            phone,
            email,
            city,
          }),
        });

      const data =
        await res.json();

      // =========================
      // SAVE CHAT
      // =========================

      setChat((prev) => [

        ...prev,

        {
          user:
            message ||
            "Dodano zdjęcie",

          ai:
            data.reply,

          image,

          generatedImage:
            data.generatedImage,
        },
      ]);

      // =========================
      // SAVE TO ORDERS
      // =========================

      await supabase

        .from("orders")

        .insert([

          {
            name,
            phone,
            email,
            city,

            description:
              message,

            image,

            generated_image:
              data.generatedImage,
          },
        ]);

      // =========================
      // SAVE PROJECT MESSAGES
      // =========================

      await supabase

        .from("project_messages")

        .insert([

          {
            project_id:
              currentProjectId,

            role: "user",

            message,
          },

          {
            project_id:
              currentProjectId,

            role: "assistant",

            message:
              data.reply,
          },
        ]);

      // =========================
      // RESET
      // =========================

      setMessage("");
      setImage(null);

    } catch (err) {

      console.log(err);

      alert(
        "Błąd AI"
      );

    } finally {

      setLoading(false);
    }
  }

  // =========================
  // PDF
  // =========================

  function generatePDF() {

    const doc =
      new jsPDF();

    doc.setFontSize(22);

    doc.text(
      "Oferta Mebli na Wymiar",
      20,
      20
    );

    doc.setFontSize(12);

    doc.text(
      `Klient: ${name}`,
      20,
      40
    );

    doc.text(
      `Telefon: ${phone}`,
      20,
      50
    );

    doc.text(
      `Email: ${email}`,
      20,
      60
    );

    doc.text(
      `Miejscowość: ${city}`,
      20,
      70
    );

    let y = 90;

    chat.forEach((item) => {

      doc.text(
        `Klient: ${item.user}`,
        20,
        y
      );

      y += 10;

      doc.text(
        `AI: ${item.ai}`,
        20,
        y
      );

      y += 20;
    });

    doc.save(
      "oferta-meble.pdf"
    );
  }

  // =========================
  // LOADING
  // =========================

  if (checkingAuth) {

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
          text-3xl
          font-bold
        ">
          Ładowanie...
        </div>

      </main>
    );
  }

  // =========================
  // NO ACCESS
  // =========================

  if (!hasAccess) {

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
          bg-gray-900
          p-10
          rounded-3xl
          border
          border-gray-800
          max-w-xl
          text-center
        ">

          <h1 className="
            text-5xl
            font-bold
            mb-4
          ">
            DreamS AI PRO
          </h1>

          <p className="
            text-gray-400
            text-lg
            mb-8
          ">
            Aby korzystać z AI
            do projektowania mebli,
            potrzebujesz aktywnego
            abonamentu PRO.
          </p>

          <div className="
            flex
            flex-col
            gap-4
            mt-8
          ">

            <button

              onClick={() =>
                buyPro("basic")
              }

              className="
                bg-gray-700
                hover:bg-gray-600
                transition
                px-8
                py-4
                rounded-2xl
                font-bold
                text-lg
              "
            >
              BASIC — 19 zł
            </button>

            <button

              onClick={() =>
                buyPro("pro")
              }

              className="
                bg-green-600
                hover:bg-green-700
                transition
                px-8
                py-4
                rounded-2xl
                font-bold
                text-lg
              "
            >
              PRO — 49 zł
            </button>

            <button

              onClick={() =>
                buyPro("premium")
              }

              className="
                bg-yellow-500
                hover:bg-yellow-400
                text-black
                transition
                px-8
                py-4
                rounded-2xl
                font-bold
                text-lg
              "
            >
              PREMIUM — 99 zł
            </button>

          </div>

          <button

            onClick={logout}

            className="
              block
              mx-auto
              mt-6
              text-gray-400
            "
          >
            Wyloguj
          </button>

        </div>

      </main>
    );
  }

  // =========================
  // APP
  // =========================

  return (

    <main className="
      min-h-screen
      bg-black
      text-white
    ">

      <div className="
        max-w-5xl
        mx-auto
        p-8
      ">

        {/* HEADER */}

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
              mb-2
            ">
              DreamS AI
            </h1>

            <p className="
              text-gray-400
              text-lg
            ">
              Projektowanie i wycena
              mebli na wymiar
            </p>

          </div>

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

        {/* CLIENT DATA */}

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
              setName(e.target.value)
            }

            className="
              p-4
              rounded-2xl
              bg-gray-900
              border
              border-gray-700
            "
          />

          <input
            placeholder="Telefon"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }

            className="
              p-4
              rounded-2xl
              bg-gray-900
              border
              border-gray-700
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
              border
              border-gray-700
              text-gray-400
            "
          />

          <input
            placeholder="Miejscowość"
            value={city}
            onChange={(e) =>
              setCity(e.target.value)
            }

            className="
              p-4
              rounded-2xl
              bg-gray-900
              border
              border-gray-700
            "
          />

        </div>

        {/* PDF */}

        <button

          onClick={generatePDF}

          className="
            mb-6
            bg-green-600
            hover:bg-green-700
            transition
            px-6
            py-3
            rounded-2xl
            font-bold
          "
        >
          Pobierz PDF Oferty
        </button>

        {/* CHAT */}

        <div className="
          space-y-6
          mb-8
        ">

          {chat.map((item, index) => (

            <div
              key={index}
              className="space-y-3"
            >

              <div className="
                bg-gray-900
                p-5
                rounded-3xl
                border
                border-gray-800
              ">

                <div className="
                  text-sm
                  text-gray-400
                  mb-2
                ">
                  Klient
                </div>

                <div className="
                  text-lg
                ">
                  {item.user}
                </div>

                {item.image && (

                  <img

                    src={item.image}

                    alt="uploaded"

                    className="
                      mt-4
                      rounded-2xl
                      max-h-96
                      object-cover
                      w-full
                    "
                  />

                )}

              </div>

              <div className="
                bg-blue-600
                p-5
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
                  text-lg
                  whitespace-pre-wrap
                ">
                  {item.ai}
                </div>

              </div>

            </div>

          ))}

          {loading && (

            <div className="
              bg-gray-900
              p-5
              rounded-3xl
              animate-pulse
            ">
              AI analizuje...
            </div>

          )}

        </div>

        {/* UPLOAD */}

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

              reader.readAsDataURL(file);
            }}

            className="
              mb-4
              block
              w-full
              text-sm
            "
          />

        </div>

        {/* INPUT */}

        <div className="
          flex
          gap-4
        ">

          <input

            className="
              flex-1
              p-5
              rounded-3xl
              bg-gray-900
              border
              border-gray-700
              text-white
              outline-none
            "

            placeholder="
              Opisz swoją kuchnię...
            "

            value={message}

            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
          />

          <button

            onClick={sendMessage}

            className="
              bg-white
              text-black
              px-8
              rounded-3xl
              font-bold
              hover:scale-105
              transition
            "
          >
            Wyślij
          </button>

        </div>

      </div>

    </main>
  );
}