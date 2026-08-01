"use client";

import { useState } from "react";

export default function RoomScannerPage() {

  const [images, setImages] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [result, setResult] =
    useState<any>(null);

  const [message, setMessage] =
    useState("");

  const [history, setHistory] =
    useState<any[]>([]);

  async function analyzeRoom() {

    if (!images.length) {

      alert(
        "Dodaj zdjęcia pomieszczenia"
      );

      return;
    }

    setLoading(true);

    try {

      const res =
        await fetch(
          "/api/room-scanner",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              images,
              message,
              history,
            }),
          }
        );

      const data =
        await res.json();

      if (!res.ok) {

        console.error(data);

        alert(
          data.error ||
          "Błąd AI Skanera pomieszczeń"
        );

        return;
      }

      setResult(data);

      setHistory(
        data.history || []
      );

      setMessage("");

    } catch (err) {

      console.error(err);

      alert(
        "Błąd AI Skaner pomieszczeń"
      );

    } finally {

      setLoading(false);
    }
  }

  return (

    <main
      className="
        min-h-screen
        bg-[#07090d]
        text-white
        p-4
        sm:p-6
        lg:p-8
      "
    >

      <div
        className="
          max-w-7xl
          mx-auto
        "
      >

        <div
          className="
            mb-12
            text-center
          "
        >

          <h1
            className="
              text-4xl
              sm:text-5xl
              lg:text-6xl
              font-black
              mb-5
              tracking-tight
            "
          >
            AI Skaner pomieszczeń
          </h1>

          <p
            className="
              text-gray-400
              text-lg
              sm:text-xl
              max-w-3xl
              mx-auto
              leading-8
            "
          >
            Projektuj AI analizuje pomieszczenie,
            projektuje luksusową kuchnię
            i pozwala rozmawiać z AI
            projektantem wnętrz.
          </p>

        </div>

        <div
          className="
            bg-[#0c1016]
            border
            border-white/10
            rounded-[28px]
            p-5
            sm:p-8
            mb-10
            shadow-2xl
          "
        >

          <input
            type="file"
            multiple
            accept="image/*"

            className="
              w-full
              p-4
              rounded-2xl
              bg-[#161b22]
              border
              border-white/10
              text-gray-300
              file:mr-4
              file:rounded-xl
              file:border-0
              file:bg-gradient-to-r
              file:from-[#d8aa4c]
              file:to-[#f4ca73]
              file:px-5
              file:py-3
              file:font-bold
              file:text-black
            "

            onChange={async (e) => {

              const files =
                Array.from(
                  e.target.files || []
                );

              const converted =
                await Promise.all(

                  files.map(
                    (file) => {

                      return new Promise<string>(
                        (resolve) => {

                          const reader =
                            new FileReader();

                          reader.onloadend =
                            () => {

                              resolve(
                                String(
                                  reader.result
                                )
                              );
                            };

                          reader.readAsDataURL(
                            file
                          );
                        }
                      );
                    }
                  )
                );

              setImages(
                converted
              );
            }}
          />

          {images.length > 0 && (

            <div
              className="
                grid
                md:grid-cols-3
                gap-6
                mt-8
              "
            >

              {images.map(
                (
                  img,
                  index
                ) => (

                  <img
                    key={index}
                    src={img}
                    alt=""
                    className="
                      rounded-2xl
                      border
                      border-white/10
                      shadow-xl
                    "
                  />
                )
              )}

            </div>
          )}

          <button

            onClick={analyzeRoom}

            disabled={loading}

            className="
              mt-10
              w-full
              bg-gradient-to-r
              from-[#d8aa4c]
              to-[#f4ca73]
              hover:brightness-110
              disabled:opacity-50
              disabled:cursor-not-allowed
              transition
              rounded-2xl
              p-5
              text-xl
              font-black
              text-black
            "
          >

            {
              loading
                ? "AI analizuje pomieszczenie..."
                : "Uruchom AI Skaner pomieszczeń"
            }

          </button>

        </div>

        {result && (

          <div
            className="
              space-y-10
            "
          >

            <div
              className="
                bg-[#0c1016]
                border
                border-white/10
                rounded-[28px]
                p-5
                sm:p-8
                shadow-2xl
              "
            >

              <h2
                className="
                  text-2xl
                  sm:text-3xl
                  font-black
                  mb-6
                "
              >
                Analiza AI
              </h2>

              <div
                className="
                  whitespace-pre-wrap
                  text-gray-300
                  leading-8
                "
              >
                {result.analysis}
              </div>

            </div>

            {result.image && (

              <div
                className="
                  bg-white/5
                  border
                  border-white/10
                  rounded-3xl
                  p-8
                "
              >

                <h2
                  className="
                    text-3xl
                    font-bold
                    mb-6
                  "
                >
                  Wizualizacja wnętrza
                </h2>

                <img
                  src={`data:image/png;base64,${result.image}`}
                  alt=""
                  className="
                    rounded-2xl
                    shadow-2xl
                    w-full
                    border
                    border-white/10
                  "
                />

              </div>
            )}

            <div
              className="
                bg-[#0c1016]
                border
                border-white/10
                rounded-[28px]
                p-5
                sm:p-8
                shadow-2xl
              "
            >

              <h2
                className="
                  text-3xl
                  font-bold
                  mb-8
                "
              >
                Rozmowa z projektantem AI
              </h2>

              <div
                className="
                  space-y-5
                  mb-8
                  max-h-[500px]
                  overflow-y-auto
                "
              >

                {history.map(
                  (
                    msg,
                    index
                  ) => (

                    <div
                      key={index}
                      className={
                        msg.role === "user"
                          ? "text-right"
                          : "text-left"
                      }
                    >

                      <div
                        className={`
                          inline-block
                          max-w-[80%]
                          rounded-3xl
                          px-6
                          py-4
                          ${
                            msg.role === "user"
                              ? "bg-gradient-to-r from-[#d8aa4c] to-[#f4ca73] text-black"
                              : "bg-white/[0.06] border border-white/10"
                          }
                        `}
                      >

                        {msg.content}

                      </div>

                    </div>
                  )
                )}

              </div>

              <div
                className="
                  flex
                  flex-col
                  gap-4
                  lg:flex-row
                "
              >

                <input

                  value={message}

                  onChange={(e) =>
                    setMessage(
                      e.target.value
                    )
                  }

                  placeholder="
                    Np. dodaj wyspę,
                    zmień fronty na dąb,
                    dodaj LED...
                  "

                  className="
                    flex-1
                    bg-[#161b22]
                    border
                    border-white/10
                    rounded-2xl
                    px-6
                    py-5
                    outline-none
                    focus:border-[#d8aa4c]/60
                  "
                />

                <button

                  onClick={analyzeRoom}

                  disabled={loading}

                  className="
                    bg-gradient-to-r
                    from-[#d8aa4c]
                    to-[#f4ca73]
                    hover:brightness-110
                    disabled:opacity-50
                    disabled:cursor-not-allowed
                    transition
                    rounded-2xl
                    px-10
                    py-5
                    font-black
                    text-black
                  "
                >

                  Wyślij

                </button>

              </div>

            </div>

          </div>
        )}

      </div>

    </main>
  );
}