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

  const [projectStatus, setProjectStatus] =
    useState("Konsultacja");

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
            data.status
          ) {

            setProjectStatus(
              data.status
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

  function detectProjectStatus(
    aiReply: string
  ) {

    const lower =
      aiReply.toLowerCase();

    if (
      lower.includes(
        "wizualizacja"
      )
    ) {

      return "Projektowanie";
    }

    if (
      lower.includes(
        "popraw"
      )
    ) {

      return "Poprawki";
    }

    if (
      lower.includes(
        "gotowy"
      )
    ) {

      return "Gotowe";
    }

    return "Konsultacja";
  }

  async function saveProject(
    updatedChat: any[],
    memory: any,
    previewImage?: string,
    status?: string
  ) {

    try {

      if (projectId) {

        await supabase

          .from("projects")

          .update({

            conversation:
              updatedChat,

            memory,

            image_url:
              previewImage,

            status,

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

              status,

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
        data?.success === false
      ) {

        console.log(data);

        alert(
          data?.error ||
          "Błąd AI"
        );

        setLoading(false);

        return;
      }

      const detectedStatus =
        detectProjectStatus(
          data.reply
        );

      setProjectStatus(
        detectedStatus
      );

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

      try {

        await saveProject(

          updatedChat,

          data.memory,

          data.generatedImage,

          detectedStatus
        );

      } catch (saveError) {

        console.log(
          "SAVE PROJECT ERROR:",
          saveError
        );
      }

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

            <div className="
              mt-4
              inline-flex
              items-center
              gap-3
              bg-blue-600/20
              border
              border-blue-500/30
              px-5
              py-3
              rounded-2xl
            ">

              <div className="
                w-3
                h-3
                rounded-full
                bg-green-400
              " />

              <div className="
                font-semibold
              ">
                Status:
                {" "}
                {projectStatus}
              </div>

            </div>

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

            <button

              onClick={async () => {

                await supabase.auth.signOut();

                window.location.href =
                  "/";
              }}

              className="
                bg-red-500
                text-white
                px-6
                py-4
                rounded-2xl
                font-bold
              "
            >
              Wyloguj
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
                                hover:scale-[1.02]
                                transition
                              "
                            >
                              Pobierz wizualizację
                            </button>

                          </div>
                        )
                      )}

                    </div>
                  )}

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

          {loading && (

            <div className="
              mb-6
              bg-blue-500/10
              border
              border-blue-500/20
              rounded-3xl
              p-5
              flex
              items-center
              gap-4
            ">

              <div className="
                w-6
                h-6
                border-2
                border-blue-400
                border-t-transparent
                rounded-full
                animate-spin
              " />

              <div>

                <div className="
                  font-bold
                  text-blue-300
                ">
                  DreamS AI pracuje...
                </div>

                <div className="
                  text-sm
                  text-gray-400
                ">
                  Tworzenie projektu i wizualizacji może potrwać chwilę.
                </div>

              </div>

            </div>
          )}

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
                min-w-[220px]
                flex
                items-center
                justify-center
              "
            >

              <div className="
                flex
                items-center
                gap-3
              ">

                {loading && (

                  <div className="
                    w-5
                    h-5
                    border-2
                    border-black
                    border-t-transparent
                    rounded-full
                    animate-spin
                  " />

                )}

                <span>

                  {
                    loading
                      ? "DreamS AI projektuje..."
                      : "Wyślij"
                  }

                </span>

              </div>

            </button>

          </div>

        </div>

      </div>

    </main>
  );
}