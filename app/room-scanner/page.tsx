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

        alert(
          data.error ||
          "Błąd AI"
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
        "Błąd AI Room Scanner"
      );

    } finally {

      setLoading(false);
    }
  }

  return (

    <main
      className="
        min-h-screen
        bg-black
        text-white
        p-6
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
            mb-14
            text-center
          "
        >

          <h1
            className="
              text-6xl
              font-bold
              mb-6
            "
          >
            AI Room Scanner
          </h1>

          <p
            className="
              text-gray-400
              text-xl
              max-w-3xl
              mx-auto
            "
          >
            DreamS AI analizuje pomieszczenie,
            projektuje luksusową kuchnię
            i pozwala rozmawiać z AI
            projektantem wnętrz.
          </p>

        </div>

        <div
          className="
            bg-white/5
            border
            border-white/10
            rounded-3xl
            p-8
            mb-10
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
              bg-white/10
              border
              border-white/10
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
                      rounded-3xl
                      border
                      border-white/10
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
              bg-green-600
              hover:bg-green-500
              disabled:opacity-50
              transition
              rounded-3xl
              p-6
              text-2xl
              font-bold
            "
          >

            {
              loading
                ? "AI analizuje pomieszczenie..."
                : "Uruchom AI Room Scanner"
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
                  Wizualizacja Kuchni
                </h2>

                <img
                  src={`data:image/png;base64,${result.image}`}
                  alt=""
                  className="
                    rounded-3xl
                    shadow-2xl
                    w-full
                  "
                />

              </div>
            )}

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
                  mb-8
                "
              >
                Rozmowa z AI Projektantem
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
                              ? "bg-green-600"
                              : "bg-white/10"
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
                  gap-4
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
                    bg-white/10
                    border
                    border-white/10
                    rounded-3xl
                    px-6
                    py-5
                    outline-none
                  "
                />

                <button

                  onClick={analyzeRoom}

                  disabled={loading}

                  className="
                    bg-green-600
                    hover:bg-green-500
                    disabled:opacity-50
                    transition
                    rounded-3xl
                    px-10
                    font-bold
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