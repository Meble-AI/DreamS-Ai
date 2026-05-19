"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Home() {

  const [message, setMessage] =
    useState("");

  const [chat, setChat] =
    useState<any[]>([]);

  const [projectMemory, setProjectMemory] =
    useState<any>(null);

  const [projectId, setProjectId] =
    useState<string | null>(null);

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

    async function loadProject() {

      try {

        const params =
          new URLSearchParams(
            window.location.search
          );

        const currentProjectId =
          params.get("project");

        if (
          !currentProjectId
        ) return;

        setProjectId(
          currentProjectId
        );

        const { data } =
          await supabase

            .from("projects")

            .select("*")

            .eq(
              "id",
              currentProjectId
            )

            .single();

        if (data) {

          if (
            data.conversation
          ) {

            setChat(
              data.conversation
            );
          }

          if (
            data.memory
          ) {

            setProjectMemory(
              data.memory
            );
          }

          if (
            data.name
          ) {

            setName(
              data.name
            );
          }

          if (
            data.phone
          ) {

            setPhone(
              data.phone
            );
          }

          if (
            data.city
          ) {

            setCity(
              data.city
            );
          }
        }

      } catch (err) {

        console.log(err);
      }
    }

    async function getUser() {

      try {

        const {
          data,
        } =
          await supabase.auth.getUser();

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

    loadProject();
    getUser();

  }, []);

  async function saveProject(
    updatedChat: any[],
    memory: any,
    previewImage?: string
  ) {

    try {

      // UPDATE EXISTING PROJECT

      if (projectId) {

        await supabase

          .from("projects")

          .update({

            conversation:
              updatedChat,

            memory,

            image_url:
              previewImage,

            updated_at:
              new Date()
                .toISOString(),
          })

          .eq(
            "id",
            projectId
          );

        return;
      }

      // CREATE NEW PROJECT

      const {
        data,
      } =
        await supabase

          .from("projects")

          .insert([

            {
              user_email:
                email,

              prompt:
                message,

              image_url:
                previewImage,

              conversation:
                updatedChat,

              memory,

              name,
              phone,
              city,
            },
          ])

          .select()

          .single();

      if (
        data?.id
      ) {

        setProjectId(
          data.id
        );

        window.history.replaceState(

          {},

          "",

          `/dashboard?project=${data.id}`
        );
      }

    } catch (err) {

      console.log(
        "SAVE ERROR:",
        err
      );
    }
  }

  async function sendMessage() {

    if (
      !message.trim()
    ) return;

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

              memory:
                projectMemory,

              image,

              name,
              phone,
              city,
              email,
            }),
          }
        );

      const data =
        await res.json();

      if (
        !data.success
      ) {

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

        generatedImages:
          data.generatedImages || [],

        floorPlan:
          data.floorPlan || null,
      };

      const updatedChat = [

        ...chat,
        newItem,
      ];

      setChat(
        updatedChat
      );

      if (
        data.memory
      ) {

        setProjectMemory(
          data.memory
        );
      }

      await saveProject(

        updatedChat,

        data.memory,

        data.generatedImage
      );

      setMessage("");
      setImage(null);

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);
    }
  }

  async function generatePDF() {

    try {

      const canvas =
        await html2canvas(
          document.body
        );

      const imgData =
        canvas.toDataURL(
          "image/png"
        );

      const pdf =
        new jsPDF(
          "p",
          "mm",
          "a4"
        );

      const width =
        pdf.internal
          .pageSize
          .getWidth();

      const height =
        (canvas.height * width)
        / canvas.width;

      pdf.addImage(

        imgData,

        "PNG",

        0,
        0,

        width,
        height
      );

      pdf.save(
        "DreamS-AI.pdf"
      );

    } catch (err) {

      console.log(err);
    }
  }

  return (

    <main className="
      min-h-screen
      bg-black
      text-white
      p-6
    ">

      <div className="
        max-w-7xl
        mx-auto
      ">

        {/* TOP */}

        <div className="
          flex
          justify-between
          items-center
          mb-10
          gap-6
          flex-wrap
        ">

          <div>

            <Image
              src="/logo.png"
              alt="DreamS AI"
              width={220}
              height={80}
            />

            <h1 className="
              text-5xl
              font-bold
              mt-4
            ">
              DreamS AI
            </h1>

          </div>

          <div className="
            flex
            gap-4
            flex-wrap
          ">

            <button

              onClick={() =>
                window.location.href =
                  "/projects"
              }

              className="
                bg-blue-600
                px-6
                py-4
                rounded-2xl
                font-bold
              "
            >
              Projekty
            </button>

            <button

              onClick={generatePDF}

              className="
                bg-white
                text-black
                px-6
                py-4
                rounded-2xl
                font-bold
              "
            >
              PDF
            </button>

          </div>

        </div>

        {/* MEMORY */}

        {projectMemory && (

          <div className="
            bg-white/5
            border
            border-white/10
            rounded-3xl
            p-6
            mb-10
          ">

            <div className="
              text-2xl
              font-bold
              mb-4
            ">
              Pamięć projektu
            </div>

            <pre className="
              text-sm
              overflow-auto
              text-green-300
            ">
              {JSON.stringify(
                projectMemory,
                null,
                2
              )}
            </pre>

          </div>
        )}

        {/* USER */}

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
            "
          />

          <input
            placeholder="Miasto"
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
              text-gray-400
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

                {/* USER */}

                <div className="
                  bg-white/5
                  rounded-3xl
                  p-6
                ">

                  <div className="
                    text-gray-400
                    mb-3
                  ">
                    Klient
                  </div>

                  <div>
                    {item.user}
                  </div>

                </div>

                {/* AI */}

                <div className="
                  bg-blue-900/40
                  rounded-3xl
                  p-6
                ">

                  <div className="
                    text-blue-200
                    mb-3
                  ">
                    DreamS AI
                  </div>

                  <div className="
                    whitespace-pre-wrap
                  ">
                    {item.ai}
                  </div>

                  {/* IMAGES */}

                  {item.generatedImages?.length > 0 && (

                    <div className="
                      grid
                      md:grid-cols-3
                      gap-6
                      mt-8
                    ">

                      {item.generatedImages.map(
                        (
                          img: string,
                          imgIndex: number
                        ) => (

                          <div
                            key={imgIndex}
                            className="
                              space-y-4
                            "
                          >

                            <img
                              src={`data:image/png;base64,${img}`}
                              alt=""
                              className="
                                rounded-3xl
                                shadow-2xl
                              "
                            />

                            <button

                              onClick={() => {

                                const link =
                                  document.createElement(
                                    "a"
                                  );

                                link.href =
                                  `data:image/png;base64,${img}`;

                                link.download =
                                  `DreamS-AI-${imgIndex + 1}.png`;

                                link.click();
                              }}

                              className="
                                w-full
                                bg-white
                                text-black
                                py-3
                                rounded-2xl
                                font-bold
                              "
                            >
                              Pobierz
                            </button>

                          </div>
                        )
                      )}

                    </div>
                  )}

                  {/* FLOORPLAN */}

                  {item.floorPlan && (

                    <div className="
                      mt-10
                    ">

                      <div className="
                        text-2xl
                        font-bold
                        mb-4
                      ">
                        📐 Rzut 2D
                      </div>

                      <img
                        src={`data:image/png;base64,${item.floorPlan}`}
                        alt=""
                        className="
                          rounded-3xl
                          bg-white
                        "
                      />

                    </div>
                  )}

                </div>

              </div>
            )
          )}

        </div>

        {/* INPUT */}

        <div className="
          bg-white/5
          rounded-3xl
          p-6
        ">

          <input

            type="file"

            onChange={(e) => {

              const file =
                e.target.files?.[0];

              if (!file)
                return;

              const reader =
                new FileReader();

              reader.onloadend =
                () => {

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
              mb-6
            "
          />

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

              onKeyDown={(e) => {

                if (
                  e.key === "Enter"
                ) {

                  sendMessage();
                }
              }}

              placeholder="
                Opisz swoją kuchnię...
              "

              className="
                flex-1
                p-6
                rounded-3xl
                bg-black/30
              "
            />

            <button

              onClick={sendMessage}

              disabled={loading}

              className="
                bg-white
                text-black
                px-10
                rounded-3xl
                font-bold
              "
            >

              {
                loading
                  ? "AI..."
                  : "Wyślij"
              }

            </button>

          </div>

        </div>

      </div>

    </main>
  );
}