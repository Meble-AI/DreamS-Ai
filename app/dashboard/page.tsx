"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import ProjectVersions
from "@/components/ProjectVersions";

export default function Home() {

  const [message, setMessage] =
    useState("");

  const [correctionMessage, setCorrectionMessage] =
    useState("");

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [chat, setChat] =
    useState<any[]>([]);

  const [projectMemory, setProjectMemory] =
    useState<any>(null);

  const [projectId, setProjectId] =
    useState<string | null>(null);

  const [projectStatus, setProjectStatus] =
    useState("Konsultacja");

  const [credits, setCredits] =
    useState<number>(0);

  const [plan, setPlan] =
    useState("FREE");

  const [loading, setLoading] =
    useState(false);

  const [images, setImages] =
    useState<string[]>([]);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [city, setCity] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [projectRating, setProjectRating] =
    useState<number>(0);

  const [showOrderPanel, setShowOrderPanel] =
    useState(false);

  const [orderMessage, setOrderMessage] =
    useState("");

  const hasVisualization =
    chat.some(
      (item) =>
        item.generatedImages?.length > 0
    );

  useEffect(() => {

    async function loadProject() {

      try {

        const params =
          new URLSearchParams(
            window.location.search
          );

const currentProjectId =
  params.get("project");

const savedProject =
  localStorage.getItem(
    "dreams_last_project"
  );

const activeProjectId =
  currentProjectId ||
  savedProject;

if (
  !activeProjectId
) return;

setProjectId(
  activeProjectId
);

const savedRating =
  localStorage.getItem(
    `project_rating_${activeProjectId}`
  );

if (savedRating) {

  setProjectRating(
    Number(savedRating)
  );
}

        const { data } =
          await supabase

            .from("projects")

            .select("*")

            .eq(
              "id",
              activeProjectId
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

    async function loadProfile() {

      try {

        const {

          data: { user },

        } =
          await supabase.auth.getUser();

        if (!user?.email)
  return;

const { data } =
  await supabase

    .from("profiles")

    .select("*")

    .eq(
      "email",
      user.email
    )

    .maybeSingle();

       console.log("USER:", user);
console.log("PROFILE:", data);

if (data) {

  setCredits(
    data.credits || 0
  );

  setPlan(
    data.plan || "FREE"
  );
}
      } catch (err) {

        console.log(err);
      }
    }

    loadProject();
    getUser();
    loadProfile();

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

      const { error } =
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

      if (error) {

        console.log(
          "UPDATE ERROR:",
          error
        );
      }

      return;
    }

    const {
      data,
      error,
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

    if (error) {

      console.log(
        "CREATE ERROR:",
        error
      );

      return;
    }

    if (data?.id) {

      setProjectId(
        data.id
      );

      localStorage.setItem(
        "dreams_last_project",
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

  async function sendMessage(
  customMessage?: string,
  isCorrection = false
) {

    const outgoingMessage =
      (
        typeof customMessage === "string"
          ? customMessage
          : message
      ).trim();

    if (
      credits <= 0
    ) {

      alert(
        "Brak kredytów 🙂 Kup pakiet aby generować projekty."
      );

      window.location.href =
        "/pricing";

      return;
    }

    if (
      !outgoingMessage
    ) return;

    setLoading(true);

    try {

      const slimHistory =
        chat
          .slice(-3)
          .map((item) => ({

            user:
              item.user,

            ai:
              item.ai,
          }));

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

              message:
                outgoingMessage,

              history:
                slimHistory,

              projectMemory,

              images,

              previousImages:
                chat
                  .flatMap(
                    (item) =>
                      item.generatedImages || []
                  )
                  .slice(-1),

              isCorrection,

              correctionRequest:
                isCorrection
                  ? outgoingMessage
                  : null,

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
        isCorrection
          ? "Poprawki"
          : detectProjectStatus(
              data.reply
            );

      setProjectStatus(
        detectedStatus
      );

      const newItem = {

        user:
          outgoingMessage,

        isCorrection,

        ai:
          data.reply,

        generatedImage:
          data.generatedImage,

        generatedImages:
          data.generatedImages || [],

        floorPlan:
          data.floorPlan || null,

        furniturePlan:
          data.furniturePlan || null,

        design:
          data.design || null,

        estimate:
          data.estimate || null,
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

      const newCredits =
        Math.max(
          credits - 1,
          0
        );

      setCredits(
        newCredits
      );

      try {

        const {

          data: { user },

        } =
          await supabase.auth.getUser();

        if (user?.email) {

  await supabase

    .from("profiles")

    .update({

      credits:
        newCredits,
    })

    .eq(
      "email",
      user.email
    );
}

      } catch (creditError) {

        console.log(
          creditError
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
      setCorrectionMessage("");
      setImages([]);

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);
    }
  }

  function applyQuickCorrection(
    correction: string
  ) {

    setCorrectionMessage(
      correction
    );
  }

  function rateProject(
    rating: number
  ) {

    setProjectRating(
      rating
    );

    if (
      projectId
    ) {

      localStorage.setItem(
        `project_rating_${projectId}`,
        String(rating)
      );
    }
  }

  function getLatestGeneratedImage() {

    const allImages =
      chat.flatMap(
        (item) =>
          item.generatedImages || []
      );

    return (
      allImages.at(-1) ||
      null
    );
  }

  function orderProject() {

    const latestImage =
      getLatestGeneratedImage();

    if (
      !latestImage
    ) {

      alert(
        "Najpierw wygeneruj wizualizację projektu."
      );

      return;
    }

    setShowOrderPanel(
      true
    );
  }

  function sendOrderRequest() {

    const subject =
      encodeURIComponent(
        `Zapytanie o realizację projektu ${projectId || ""}`
      );

    const body =
      encodeURIComponent(
        [
          "Dzień dobry,",
          "",
          "Chcę zamówić realizację projektu przygotowanego w Projektuj AI.",
          "",
          `ID projektu: ${projectId || "brak"}`,
          `Imię: ${name || "nie podano"}`,
          `Telefon: ${phone || "nie podano"}`,
          `Miejscowość: ${city || "nie podano"}`,
          `E-mail: ${email || "nie podano"}`,
          "",
          "Dodatkowe uwagi:",
          orderMessage || "brak",
        ].join("\\n")
      );

    window.location.href =
      `mailto:kontakt@dreamsai.pl?subject=${subject}&body=${body}`;

    setShowOrderPanel(
      false
    );
  }

  function downloadImage(
    base64Image: string,
    fileName = "Projektuj-AI-wizualizacja.png"
  ) {

    try {

      const link =
        document.createElement(
          "a"
        );

      link.href =
        `data:image/png;base64,${base64Image}`;

      link.download =
        fileName;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

    } catch (err) {

      console.log(
        "DOWNLOAD ERROR:",
        err
      );

      alert(
        "Nie udało się pobrać zdjęcia."
      );
    }
  }

  function getLatestTechnicalData() {

    for (
      let index = chat.length - 1;
      index >= 0;
      index -= 1
    ) {

      const item =
        chat[index];

      if (
        item?.furniturePlan ||
        item?.design ||
        item?.estimate
      ) {

        return {
          furniturePlan:
            item.furniturePlan ||
            null,

          design:
            item.design ||
            null,

          estimate:
            item.estimate ||
            null,
        };
      }
    }

    return {
      furniturePlan:
        null,

      design:
        null,

      estimate:
        null,
    };
  }

  const latestTechnicalData =
    getLatestTechnicalData();

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
        "Projektuj-AI.pdf"
      );

    } catch (err) {

      console.log(err);
    }
  }


  useEffect(() => {

    const elements =
      Array.from(
        document.querySelectorAll(
          "body > header, body > nav"
        )
      ) as HTMLElement[];

    elements.forEach((element) => {
      element.dataset.dreamsPreviousDisplay =
        element.style.display || "";

      element.style.display =
        "none";
    });

    return () => {

      elements.forEach((element) => {
        element.style.display =
          element.dataset.dreamsPreviousDisplay || "";
      });
    };

  }, []);

  async function createNewProject() {

    localStorage.removeItem(
      "dreams_last_project"
    );

    setProjectId(
      null
    );

    setChat(
      []
    );

    setProjectMemory(
      null
    );

    setProjectStatus(
      "Konsultacja"
    );

    setMessage(
      ""
    );

    setCorrectionMessage(
      ""
    );

    setImages(
      []
    );

    window.history.replaceState(
      {},
      "",
      "/dashboard"
    );
  }

  async function deleteCurrentProject() {

    if (
      !projectId
    ) {

      createNewProject();

      return;
    }

    const accepted =
      window.confirm(
        "Czy na pewno chcesz usunąć ten projekt?"
      );

    if (
      !accepted
    ) return;

    const { error } =
      await supabase

        .from("projects")

        .delete()

        .eq(
          "id",
          projectId
        );

    if (
      error
    ) {

      console.log(
        "DELETE PROJECT ERROR:",
        error
      );

      alert(
        "Nie udało się usunąć projektu."
      );

      return;
    }

    createNewProject();
  }

  return (

    <main
      className="
        min-h-screen
        bg-[#07090d]
        text-white
      "
    >

      <div
        className="
          min-h-screen
          lg:grid
          lg:grid-cols-[320px_1fr]
        "
      >

        {/* LEWY PANEL */}

        <aside
          className="
            hidden
            lg:flex
            lg:fixed
            lg:inset-y-0
            lg:left-0
            lg:w-[320px]
            lg:flex-col
            border-r
            border-white/10
            bg-[#090c11]
            px-5
            py-6
            z-40
          "
        >

          <div
            className="
              px-3
              pb-7
              border-b
              border-white/10
            "
          >

            <Image
              src="/logo.png"
              alt="Projektuj AI"
              width={240}
              height={85}
              priority
              className="
                h-auto
                w-[235px]
                object-contain
              "
            />

          </div>

          <nav
            className="
              mt-7
              space-y-2
            "
          >

            <button
              type="button"
              className="
                flex
                w-full
                items-center
                gap-4
                rounded-2xl
                border
                border-[#d8aa4c]/20
                bg-gradient-to-r
                from-[#d8aa4c]/15
                to-white/5
                px-5
                py-4
                text-left
                font-semibold
                text-[#f0c56e]
              "
            >
              <span className="text-xl">⌂</span>
              Mój projekt
            </button>

            <button
              type="button"
              onClick={() =>
                window.location.href =
                  "/projects"
              }
              className="
                flex
                w-full
                items-center
                gap-4
                rounded-2xl
                px-5
                py-4
                text-left
                text-gray-200
                transition
                hover:bg-white/5
              "
            >
              <span className="text-xl">↶</span>
              Historia projektów
            </button>

            <button
              type="button"
              className="
                flex
                w-full
                items-center
                gap-4
                rounded-2xl
                px-5
                py-4
                text-left
                text-gray-200
                transition
                hover:bg-white/5
              "
            >
              <span className="text-xl">♙</span>
              Moje dane
            </button>

            <button
              type="button"
              onClick={() =>
                window.location.href =
                  "/pricing"
              }
              className="
                flex
                w-full
                items-center
                gap-4
                rounded-2xl
                px-5
                py-4
                text-left
                text-gray-200
                transition
                hover:bg-white/5
              "
            >
              <span className="text-xl">▭</span>
              Pakiety i płatności
            </button>

          </nav>

          <div
            className="
              mt-6
              border-t
              border-white/10
              pt-6
            "
          >

            <div
              className="
                rounded-3xl
                border
                border-[#d8aa4c]/25
                bg-gradient-to-br
                from-[#d8aa4c]/10
                to-transparent
                p-5
              "
            >

              <div
                className="
                  text-lg
                  font-bold
                  text-[#f0c56e]
                "
              >
                Masz pomysł na wnętrze?
              </div>

              <p
                className="
                  mt-3
                  leading-7
                  text-gray-400
                "
              >
                Stwórz wizualizację, wprowadź poprawki i przygotuj projekt do realizacji.
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.href =
                    "/pricing"
                }
                className="
                  mt-5
                  w-full
                  rounded-2xl
                  bg-gradient-to-r
                  from-[#d8aa4c]
                  to-[#f4ca73]
                  px-5
                  py-3.5
                  font-bold
                  text-black
                  transition
                  hover:brightness-110
                "
              >
                Zobacz pakiety
              </button>

            </div>

          </div>

          <div
            className="
              mt-auto
              rounded-3xl
              border
              border-white/10
              bg-white/[0.03]
              p-5
            "
          >

            <div className="font-bold">
              Potrzebujesz pomocy?
            </div>

            <div
              className="
                mt-2
                text-sm
                text-gray-400
              "
            >
              Skontaktuj się z nami
            </div>

            <div
              className="
                mt-3
                text-[#f0c56e]
              "
            >
              kontakt@dreamsai.pl
            </div>

          </div>

        </aside>

        {/* GŁÓWNA CZĘŚĆ */}

        <section
          className="
            min-w-0
            lg:col-start-2
          "
        >

          {/* GÓRNY PASEK */}

          <div
            className="
              sticky
              top-0
              z-30
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
                max-w-[1500px]
                items-center
                justify-between
                gap-4
                px-4
                py-4
                sm:px-6
                lg:px-8
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                  lg:hidden
                "
              >

                <Image
                  src="/logo.png"
                  alt="Projektuj AI"
                  width={155}
                  height={55}
                  className="
                    h-auto
                    w-[155px]
                  "
                />

              </div>

              <div
                className="
                  ml-auto
                  flex
                  items-center
                  gap-2
                  sm:gap-3
                "
              >

                <div
                  className="
                    hidden
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    sm:block
                  "
                >
                  Kredyty: {credits}
                </div>

                <div
                  className="
                    hidden
                    max-w-[250px]
                    truncate
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-3
                    text-sm
                    text-gray-300
                    md:block
                  "
                >
                  {email || "Moje konto"}
                </div>

                <button
                  type="button"
                  onClick={async () => {

                    await supabase.auth.signOut();

                    window.location.href =
                      "/";
                  }}
                  className="
                    rounded-xl
                    border
                    border-[#d8aa4c]/60
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    transition
                    hover:bg-[#d8aa4c]
                    hover:text-black
                    sm:px-5
                  "
                >
                  Wyloguj się
                </button>

              </div>

            </div>

          </div>

          <div
            className="
              mx-auto
              max-w-[1500px]
              px-4
              py-6
              sm:px-6
              lg:px-8
              lg:py-8
            "
          >

            {/* TYTUŁ I AKCJE */}

            <div
              className="
                flex
                flex-col
                gap-6
                border-b
                border-white/10
                pb-7
                xl:flex-row
                xl:items-start
                xl:justify-between
              "
            >

              <div>

                <h1
                  className="
                    text-3xl
                    font-bold
                    tracking-tight
                    sm:text-4xl
                  "
                >
                  Mój projekt
                </h1>

                <p
                  className="
                    mt-2
                    text-gray-400
                  "
                >
                  Twórz, poprawiaj i realizuj swoje wymarzone wnętrza z AI.
                </p>

              </div>

              <div
                className="
                  flex
                  flex-wrap
                  gap-3
                "
              >

                <button
                  type="button"
                  onClick={createNewProject}
                  className="
                    rounded-xl
                    bg-blue-600
                    px-5
                    py-3
                    font-semibold
                    transition
                    hover:bg-blue-500
                  "
                >
                  + Nowy projekt
                </button>

                <button
                  type="button"
                  onClick={() =>
                    window.location.href =
                      "/room-scanner"
                  }
                  className="
                    rounded-xl
                    bg-green-600
                    px-5
                    py-3
                    font-semibold
                    transition
                    hover:bg-green-500
                  "
                >
                  AI Skaner pomieszczeń
                </button>

                <button
                  type="button"
                  onClick={generatePDF}
                  className="
                    rounded-xl
                    bg-white
                    px-5
                    py-3
                    font-semibold
                    text-black
                    transition
                    hover:bg-gray-200
                  "
                >
                  PDF
                </button>

                <button
                  type="button"
                  onClick={deleteCurrentProject}
                  className="
                    rounded-xl
                    bg-red-600
                    px-5
                    py-3
                    font-semibold
                    transition
                    hover:bg-red-500
                  "
                >
                  Usuń projekt
                </button>

              </div>

            </div>

            {/* STATUS */}

            <div
              className="
                mt-5
                inline-flex
                items-center
                gap-3
                rounded-2xl
                border
                border-white/10
                bg-white/[0.03]
                px-5
                py-3
              "
            >

              <div
                className="
                  h-3
                  w-3
                  rounded-full
                  bg-green-400
                  shadow-[0_0_18px_rgba(74,222,128,0.8)]
                "
              />

              <div className="font-semibold">
                Status: {projectStatus}
              </div>

            </div>


            {/* PODSUMOWANIE PROJEKTU */}

            {projectMemory && (

              <div
                className="
                  mt-7
                  grid
                  gap-4
                  sm:grid-cols-2
                  xl:grid-cols-5
                "
              >

                {[
                  {
                    label:
                      "Styl",

                    value:
                      projectMemory?.styl ||
                      "Nie określono",
                  },

                  {
                    label:
                      "Fronty",

                    value:
                      projectMemory?.kolor_frontow ||
                      "Nie określono",
                  },

                  {
                    label:
                      "Blat",

                    value:
                      projectMemory?.blat ||
                      "Nie określono",
                  },

                  {
                    label:
                      "Układ",

                    value:
                      projectMemory?.uklad ||
                      "Nie określono",
                  },

                  {
                    label:
                      "Wersja",

                    value:
                      `v${projectMemory?.version_number || 1}`,
                  },
                ].map(
                  (
                    item
                  ) => (

                    <div
                      key={
                        item.label
                      }
                      className="
                        rounded-2xl
                        border
                        border-white/10
                        bg-[#0c1016]
                        p-5
                      "
                    >

                      <div
                        className="
                          text-xs
                          font-semibold
                          uppercase
                          tracking-[0.16em]
                          text-gray-500
                        "
                      >
                        {item.label}
                      </div>

                      <div
                        className="
                          mt-2
                          text-lg
                          font-bold
                          text-white
                        "
                      >
                        {item.value}
                      </div>

                    </div>

                  )
                )}

              </div>

            )}

            {/* PLAN TECHNICZNY */}

            {latestTechnicalData.furniturePlan && (

              <div
                className="
                  mt-7
                  rounded-3xl
                  border
                  border-white/10
                  bg-[#0c1016]
                  p-5
                  sm:p-6
                "
              >

                <div
                  className="
                    flex
                    flex-col
                    gap-4
                    border-b
                    border-white/10
                    pb-5
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >

                  <div>

                    <div
                      className="
                        text-sm
                        font-semibold
                        uppercase
                        tracking-[0.18em]
                        text-[#d8aa4c]
                      "
                    >
                      Plan techniczny kuchni
                    </div>

                    <h2
                      className="
                        mt-2
                        text-2xl
                        font-black
                      "
                    >
                      Rozmieszczenie mebli co do 1 mm
                    </h2>

                  </div>

                  <div
                    className={`
                      w-fit
                      rounded-full
                      border
                      px-4
                      py-2
                      text-sm
                      font-bold
                      ${
                        latestTechnicalData
                          .furniturePlan
                          .success
                          ? "border-green-500/25 bg-green-500/10 text-green-300"
                          : "border-amber-500/25 bg-amber-500/10 text-amber-300"
                      }
                    `}
                  >
                    {
                      latestTechnicalData
                        .furniturePlan
                        .success
                        ? "Plan dopasowany"
                        : "Wymaga sprawdzenia"
                    }
                  </div>

                </div>

                <div
                  className="
                    mt-6
                    grid
                    gap-6
                  "
                >

                  {(
                    latestTechnicalData
                      .furniturePlan
                      .wallSummaries ||
                    []
                  ).map(
                    (
                      wall: any
                    ) => {

                      const wallModules =
                        (
                          latestTechnicalData
                            .furniturePlan
                            .modules ||
                          []
                        ).filter(
                          (
                            module: any
                          ) =>
                            module.wall ===
                            wall.wall_id
                        );

                      return (

                        <div
                          key={
                            wall.wall_id
                          }
                          className="
                            rounded-2xl
                            border
                            border-white/10
                            bg-black/20
                            p-5
                          "
                        >

                          <div
                            className="
                              flex
                              flex-col
                              gap-3
                              sm:flex-row
                              sm:items-center
                              sm:justify-between
                            "
                          >

                            <div>

                              <div
                                className="
                                  text-xl
                                  font-black
                                "
                              >
                                Ściana {wall.wall_id}
                              </div>

                              <div
                                className="
                                  mt-1
                                  text-sm
                                  text-gray-500
                                "
                              >
                                Długość:
                                {" "}
                                {
                                  wall.wall_length_mm ??
                                  "brak wymiaru"
                                }
                                {
                                  wall.wall_length_mm
                                    ? " mm"
                                    : ""
                                }
                              </div>

                            </div>

                            <div
                              className={`
                                w-fit
                                rounded-xl
                                border
                                px-4
                                py-2
                                text-sm
                                font-bold
                                ${
                                  wall.exact_fit
                                    ? "border-green-500/25 bg-green-500/10 text-green-300"
                                    : "border-white/10 bg-white/5 text-gray-300"
                                }
                              `}
                            >
                              {
                                wall.exact_fit
                                  ? "Różnica: 0 mm"
                                  : `Różnica: ${wall.difference_mm ?? "—"} mm`
                              }
                            </div>

                          </div>

                          <div
                            className="
                              mt-5
                              overflow-x-auto
                            "
                          >

                            <table
                              className="
                                w-full
                                min-w-[760px]
                                border-collapse
                                text-left
                              "
                            >

                              <thead>

                                <tr
                                  className="
                                    border-b
                                    border-white/10
                                    text-xs
                                    uppercase
                                    tracking-[0.14em]
                                    text-gray-500
                                  "
                                >

                                  <th className="px-3 py-3">
                                    Element
                                  </th>

                                  <th className="px-3 py-3">
                                    Szerokość
                                  </th>

                                  <th className="px-3 py-3">
                                    Pozycja od lewej
                                  </th>

                                  <th className="px-3 py-3">
                                    Koniec
                                  </th>

                                  <th className="px-3 py-3">
                                    Rodzaj
                                  </th>

                                </tr>

                              </thead>

                              <tbody>

                                {wallModules.map(
                                  (
                                    module: any
                                  ) => (

                                    <tr
                                      key={
                                        module.id
                                      }
                                      className="
                                        border-b
                                        border-white/5
                                      "
                                    >

                                      <td
                                        className="
                                          px-3
                                          py-4
                                          font-semibold
                                          text-white
                                        "
                                      >
                                        {module.name}
                                      </td>

                                      <td
                                        className="
                                          px-3
                                          py-4
                                          text-[#f0c56e]
                                        "
                                      >
                                        {
                                          module.calculated_width_mm ??
                                          module.width_mm ??
                                          "—"
                                        }
                                        {" "}
                                        mm
                                      </td>

                                      <td
                                        className="
                                          px-3
                                          py-4
                                          text-gray-300
                                        "
                                      >
                                        {
                                          module.position_mm ??
                                          "—"
                                        }
                                        {
                                          module.position_mm !==
                                            null
                                            ? " mm"
                                            : ""
                                        }
                                      </td>

                                      <td
                                        className="
                                          px-3
                                          py-4
                                          text-gray-300
                                        "
                                      >
                                        {
                                          module.end_position_mm ??
                                          "—"
                                        }
                                        {
                                          module.end_position_mm !==
                                            null
                                            ? " mm"
                                            : ""
                                        }
                                      </td>

                                      <td
                                        className="
                                          px-3
                                          py-4
                                          text-gray-500
                                        "
                                      >
                                        {
                                          module.source ===
                                            "calculated"
                                            ? "na wymiar"
                                            : module.source ===
                                                "appliance"
                                              ? "AGD"
                                              : module.source ===
                                                  "filler"
                                                ? "blenda"
                                                : "projekt"
                                        }
                                      </td>

                                    </tr>

                                  )
                                )}

                              </tbody>

                            </table>

                          </div>

                          <div
                            className="
                              mt-5
                              flex
                              flex-wrap
                              gap-3
                              border-t
                              border-white/10
                              pt-4
                              text-sm
                            "
                          >

                            <div
                              className="
                                rounded-xl
                                bg-white/5
                                px-4
                                py-2
                                text-gray-300
                              "
                            >
                              Wykorzystano:
                              {" "}
                              <strong>
                                {wall.used_length_mm} mm
                              </strong>
                            </div>

                            <div
                              className="
                                rounded-xl
                                bg-white/5
                                px-4
                                py-2
                                text-gray-300
                              "
                            >
                              Liczba elementów:
                              {" "}
                              <strong>
                                {wallModules.length}
                              </strong>
                            </div>

                          </div>

                        </div>

                      );
                    }
                  )}

                </div>

                {latestTechnicalData.design && (

                  <div
                    className="
                      mt-6
                      grid
                      gap-4
                      md:grid-cols-2
                    "
                  >

                    <div
                      className="
                        rounded-2xl
                        border
                        border-white/10
                        bg-black/20
                        p-5
                      "
                    >

                      <div
                        className="
                          text-sm
                          font-semibold
                          uppercase
                          tracking-[0.16em]
                          text-gray-500
                        "
                      >
                        Materiały
                      </div>

                      <div
                        className="
                          mt-4
                          space-y-2
                          text-gray-300
                        "
                      >

                        <div>
                          Fronty:
                          {" "}
                          <strong>
                            {
                              latestTechnicalData
                                .design
                                .materials
                                ?.fronts ||
                              "nie określono"
                            }
                          </strong>
                        </div>

                        <div>
                          Blat:
                          {" "}
                          <strong>
                            {
                              latestTechnicalData
                                .design
                                .materials
                                ?.countertop ||
                              "nie określono"
                            }
                          </strong>
                        </div>

                        <div>
                          System otwierania:
                          {" "}
                          <strong>
                            {
                              latestTechnicalData
                                .design
                                .materials
                                ?.handles ||
                              "nie określono"
                            }
                          </strong>
                        </div>

                        <div>
                          Wysłona:
                          {" "}
                          <strong>
                            {
                              latestTechnicalData
                                .design
                                .materials
                                ?.backsplash ||
                              "nie określono"
                            }
                          </strong>
                        </div>

                      </div>

                    </div>

                    {latestTechnicalData.estimate && (

                      <div
                        className="
                          rounded-2xl
                          border
                          border-[#d8aa4c]/25
                          bg-[#d8aa4c]/10
                          p-5
                        "
                      >

                        <div
                          className="
                            text-sm
                            font-semibold
                            uppercase
                            tracking-[0.16em]
                            text-[#f0c56e]
                          "
                        >
                          Szacunkowa wycena
                        </div>

                        <div
                          className="
                            mt-4
                            text-3xl
                            font-black
                            text-white
                          "
                        >
                          {
                            latestTechnicalData
                              .estimate
                              .brutto
                              ?.toLocaleString(
                                "pl-PL"
                              )
                          }
                          {" "}
                          zł brutto
                        </div>

                        <div
                          className="
                            mt-2
                            text-gray-400
                          "
                        >
                          Netto:
                          {" "}
                          {
                            latestTechnicalData
                              .estimate
                              .netto
                              ?.toLocaleString(
                                "pl-PL"
                              )
                          }
                          {" "}
                          zł
                        </div>

                        <div
                          className="
                            mt-4
                            text-sm
                            leading-6
                            text-gray-500
                          "
                        >
                          Wycena orientacyjna. Finalna cena wymaga dokładnego pomiaru i specyfikacji materiałowej.
                        </div>

                      </div>

                    )}

                  </div>

                )}

                {(
                  latestTechnicalData
                    .furniturePlan
                    .issues ||
                  []
                ).length > 0 && (

                  <details
                    className="
                      mt-6
                      rounded-2xl
                      border
                      border-white/10
                      bg-black/20
                      p-5
                    "
                  >

                    <summary
                      className="
                        cursor-pointer
                        font-bold
                        text-gray-300
                      "
                    >
                      Uwagi techniczne
                    </summary>

                    <div
                      className="
                        mt-4
                        space-y-3
                      "
                    >

                      {
                        latestTechnicalData
                          .furniturePlan
                          .issues
                          .map(
                            (
                              issue: any
                            ) => (

                              <div
                                key={
                                  issue.id
                                }
                                className="
                                  rounded-xl
                                  border
                                  border-white/10
                                  bg-white/[0.03]
                                  p-4
                                "
                              >

                                <div
                                  className="
                                    font-semibold
                                    text-white
                                  "
                                >
                                  {issue.title}
                                </div>

                                <div
                                  className="
                                    mt-1
                                    text-sm
                                    leading-6
                                    text-gray-400
                                  "
                                >
                                  {issue.description}
                                </div>

                              </div>

                            )
                          )
                      }

                    </div>

                  </details>

                )}

              </div>

            )}

            {/* WERSJE */}

            <div className="mt-7">
              <ProjectVersions chat={chat} />
            </div>

            {/* ROZMOWA */}

            <div
              className="
                mt-7
                space-y-6
              "
            >

              {chat.length === 0 && (

                <div
                  className="
                    rounded-3xl
                    border
                    border-white/10
                    bg-gradient-to-br
                    from-white/[0.05]
                    to-transparent
                    px-6
                    py-12
                    text-center
                  "
                >

                  <div
                    className="
                      mx-auto
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-[#d8aa4c]/15
                      text-2xl
                    "
                  >
                    ✦
                  </div>

                  <h2
                    className="
                      mt-5
                      text-2xl
                      font-bold
                    "
                  >
                    Zacznij nowy projekt
                  </h2>

                  <p
                    className="
                      mx-auto
                      mt-2
                      max-w-2xl
                      text-gray-400
                    "
                  >
                    Opisz wnętrze, dodaj zdjęcie pomieszczenia i pozwól agentowi AI przygotować wizualizację.
                  </p>

                </div>

              )}

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

                    <div
                      className="
                        ml-auto
                        max-w-[900px]
                        rounded-2xl
                        border
                        border-white/10
                        bg-gradient-to-r
                        from-[#151a22]
                        to-[#1a2029]
                        px-6
                        py-4
                      "
                    >

                      <div
                        className="
                          text-sm
                          text-gray-400
                        "
                      >
                        {
                          item.isCorrection
                            ? "Uwagi klienta"
                            : "Klient"
                        }
                      </div>

                      <div
                        className="
                          mt-1
                          leading-7
                          text-gray-100
                        "
                      >
                        {item.user}
                      </div>

                    </div>

                    <div
                      className="
                        rounded-3xl
                        border
                        border-white/10
                        bg-[#0c1016]
                        p-4
                        sm:p-6
                      "
                    >

                      <div
                        className="
                          flex
                          items-center
                          gap-3
                          font-bold
                        "
                      >

                        <div
                          className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-full
                            bg-[#d8aa4c]/15
                            text-[#f0c56e]
                          "
                        >
                          ✦
                        </div>

                        Projektuj AI

                      </div>

                      <div
                        className="
                          mt-4
                          whitespace-pre-wrap
                          leading-7
                          text-gray-300
                        "
                      >
                        {item.ai}
                      </div>

                      {item.generatedImages?.length > 0 && (

                        <div
                          className="
                            mt-6
                            grid
                            gap-6
                          "
                        >

                          {item.generatedImages.map(
                            (
                              img: string,
                              imgIndex: number
                            ) => (

                              <div
                                key={imgIndex}
                                className="
                                  overflow-hidden
                                  rounded-2xl
                                  border
                                  border-white/10
                                  bg-black
                                "
                              >

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedImage(
                                      img
                                    )
                                  }
                                  className="
                                    block
                                    w-full
                                    cursor-zoom-in
                                  "
                                >

                                  <img
                                    src={`data:image/png;base64,${img}`}
                                    alt={`Wizualizacja ${imgIndex + 1}`}
                                    className="
                                      max-h-[760px]
                                      w-full
                                      object-contain
                                      transition
                                      duration-300
                                      hover:scale-[1.01]
                                    "
                                  />

                                </button>

                                <div
                                  className="
                                    flex
                                    flex-wrap
                                    gap-3
                                    border-t
                                    border-white/10
                                    bg-[#0b0e13]
                                    p-3
                                  "
                                >

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedImage(
                                        img
                                      )
                                    }
                                    className="
                                      rounded-xl
                                      border
                                      border-white/15
                                      px-5
                                      py-3
                                      font-semibold
                                      transition
                                      hover:bg-white/5
                                    "
                                  >
                                    Powiększ
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      downloadImage(
                                        img,
                                        `Projektuj-AI-${index + 1}-${imgIndex + 1}.png`
                                      )
                                    }
                                    className="
                                      rounded-xl
                                      border
                                      border-white/15
                                      px-5
                                      py-3
                                      font-semibold
                                      transition
                                      hover:bg-white/5
                                    "
                                  >
                                    Pobierz
                                  </button>

                                </div>

                              </div>

                            )
                          )}

                        </div>

                      )}

                    </div>

                  </div>

                )
              )}

            </div>

            {/* POPRAWKI */}

            {hasVisualization && (

              <div
                className="
                  mt-7
                  rounded-3xl
                  border
                  border-white/10
                  bg-[#0c1016]
                  p-5
                  sm:p-6
                "
              >

                <h2
                  className="
                    text-xl
                    font-bold
                  "
                >
                  Masz uwagi do projektu?
                </h2>

                <p
                  className="
                    mt-2
                    text-gray-400
                  "
                >
                  Napisz, co chcesz zmienić. Zachowamy cały projekt i zmienimy tylko wskazane elementy.
                </p>


                <div
                  className="
                    mt-5
                    flex
                    flex-wrap
                    gap-3
                  "
                >

                  {[
                    "Jaśniejsze fronty",
                    "Więcej drewna",
                    "Zmień blat na drewniany",
                    "Dodaj witrynę",
                    "Usuń witrynę",
                    "Powiększ wyspę",
                    "Dodaj więcej LED",
                  ].map(
                    (
                      correction
                    ) => (

                      <button
                        key={
                          correction
                        }
                        type="button"
                        onClick={() =>
                          applyQuickCorrection(
                            correction
                          )
                        }
                        className="
                          rounded-full
                          border
                          border-[#d8aa4c]/30
                          bg-[#d8aa4c]/10
                          px-4
                          py-2
                          text-sm
                          font-semibold
                          text-[#f0c56e]
                          transition
                          hover:bg-[#d8aa4c]/20
                        "
                      >
                        {correction}
                      </button>

                    )
                  )}

                </div>

                <div
                  className="
                    mt-5
                    flex
                    flex-col
                    gap-3
                    lg:flex-row
                  "
                >

                  <textarea
                    value={correctionMessage}
                    onChange={(e) =>
                      setCorrectionMessage(
                        e.target.value
                      )
                    }
                    placeholder="Np. jaśniejsze fronty, dodaj witrynę, zmień blat na drewniany..."
                    className="
                      min-h-[110px]
                      flex-1
                      resize-y
                      rounded-2xl
                      border
                      border-white/10
                      bg-[#161b22]
                      px-5
                      py-4
                      text-white
                      outline-none
                      placeholder:text-gray-500
                      focus:border-green-500
                      lg:min-h-[64px]
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      sendMessage(
                        correctionMessage,
                        true
                      )
                    }
                    disabled={
                      loading ||
                      !correctionMessage.trim()
                    }
                    className="
                      rounded-2xl
                      bg-green-600
                      px-7
                      py-4
                      font-bold
                      transition
                      hover:bg-green-500
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {
                      loading
                        ? "Wprowadzanie poprawek..."
                        : "Wyślij poprawki"
                    }
                  </button>

                </div>

              </div>

            )}


            {hasVisualization && (

              <div
                className="
                  mt-7
                  grid
                  gap-6
                  xl:grid-cols-2
                "
              >

                <div
                  className="
                    rounded-3xl
                    border
                    border-white/10
                    bg-[#0c1016]
                    p-6
                  "
                >

                  <h2
                    className="
                      text-xl
                      font-bold
                    "
                  >
                    Oceń projekt AI
                  </h2>

                  <p
                    className="
                      mt-2
                      text-gray-400
                    "
                  >
                    Twoja ocena pomoże nam poprawiać jakość kolejnych wizualizacji.
                  </p>

                  <div
                    className="
                      mt-5
                      flex
                      gap-2
                    "
                  >

                    {[1, 2, 3, 4, 5].map(
                      (
                        rating
                      ) => (

                        <button
                          key={
                            rating
                          }
                          type="button"
                          onClick={() =>
                            rateProject(
                              rating
                            )
                          }
                          className={`
                            text-3xl
                            transition
                            ${
                              rating <= projectRating
                                ? "text-[#f0c56e]"
                                : "text-gray-700 hover:text-[#d8aa4c]"
                            }
                          `}
                        >
                          ★
                        </button>

                      )
                    )}

                  </div>

                </div>

                <div
                  className="
                    rounded-3xl
                    border
                    border-[#d8aa4c]/25
                    bg-gradient-to-br
                    from-[#d8aa4c]/10
                    to-transparent
                    p-6
                  "
                >

                  <h2
                    className="
                      text-xl
                      font-bold
                      text-[#f0c56e]
                    "
                  >
                    Projekt jest gotowy?
                  </h2>

                  <p
                    className="
                      mt-2
                      text-gray-300
                    "
                  >
                    Wyślij projekt do wyceny i omów realizację z naszym zespołem.
                  </p>

                  <button
                    type="button"
                    onClick={
                      orderProject
                    }
                    className="
                      mt-5
                      w-full
                      rounded-2xl
                      bg-gradient-to-r
                      from-[#d8aa4c]
                      to-[#f4ca73]
                      px-7
                      py-4
                      font-black
                      text-black
                      transition
                      hover:brightness-110
                    "
                  >
                    Zamów ten projekt
                  </button>

                </div>

              </div>

            )}

            {/* NOWA WIADOMOŚĆ */}

            <div
              className="
                mt-7
                rounded-3xl
                border
                border-white/10
                bg-[#0c1016]
                p-5
                sm:p-6
              "
            >

              <div
                className="
                  flex
                  flex-col
                  gap-5
                "
              >

                <label
                  className="
                    flex
                    cursor-pointer
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-dashed
                    border-white/20
                    bg-white/[0.03]
                    px-5
                    py-4
                    text-center
                    font-semibold
                    text-gray-300
                    transition
                    hover:border-[#d8aa4c]/50
                    hover:bg-[#d8aa4c]/5
                  "
                >

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {

                      const files =
                        Array.from(
                          e.target.files || []
                        );

                      if (
                        !files.length
                      ) return;

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

                  Dodaj zdjęcia pomieszczenia

                </label>

                {images.length > 0 && (

                  <div
                    className="
                      grid
                      grid-cols-2
                      gap-4
                      md:grid-cols-4
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
                          alt={`Załącznik ${index + 1}`}
                          className="
                            aspect-square
                            w-full
                            rounded-2xl
                            border
                            border-white/10
                            object-cover
                          "
                        />

                      )
                    )}

                  </div>

                )}

                {loading && (

                  <div
                    className="
                      flex
                      items-center
                      gap-4
                      rounded-2xl
                      border
                      border-blue-500/20
                      bg-blue-500/10
                      p-5
                    "
                  >

                    <div
                      className="
                        h-6
                        w-6
                        animate-spin
                        rounded-full
                        border-2
                        border-blue-400
                        border-t-transparent
                      "
                    />

                    <div>

                      <div
                        className="
                          font-bold
                          text-blue-300
                        "
                      >
                        Projektuj AI pracuje...
                      </div>

                      <div
                        className="
                          mt-1
                          text-sm
                          text-gray-400
                        "
                      >
                        Analizujemy pomieszczenie i przygotowujemy wizualizację.
                      </div>

                    </div>

                  </div>

                )}

                <div
                  className="
                    flex
                    flex-col
                    gap-3
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
                    onKeyDown={(e) => {

                      if (
                        e.key === "Enter"
                      ) {

                        sendMessage();
                      }
                    }}
                    placeholder={
                      hasVisualization
                        ? "Napisz kolejną wiadomość do projektanta AI..."
                        : "Opisz swoje wymarzone wnętrze..."
                    }
                    className="
                      min-h-[62px]
                      flex-1
                      rounded-2xl
                      border
                      border-white/10
                      bg-[#161b22]
                      px-5
                      text-white
                      outline-none
                      placeholder:text-gray-500
                      focus:border-[#d8aa4c]/60
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      sendMessage()
                    }
                    disabled={
                      loading ||
                      !message.trim()
                    }
                    className="
                      min-w-[200px]
                      rounded-2xl
                      bg-gradient-to-r
                      from-[#d8aa4c]
                      to-[#f2c66d]
                      px-8
                      py-4
                      font-bold
                      text-black
                      transition
                      hover:brightness-110
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {
                      loading
                        ? "Projektowanie..."
                        : "Wyślij"
                    }
                  </button>

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>


      {showOrderPanel && (

        <div
          className="
            fixed
            inset-0
            z-[110]
            flex
            items-center
            justify-center
            bg-black/90
            p-4
          "
          onClick={() =>
            setShowOrderPanel(
              false
            )
          }
        >

          <div
            className="
              w-full
              max-w-2xl
              rounded-[28px]
              border
              border-white/10
              bg-[#0c1016]
              p-6
              shadow-2xl
              sm:p-8
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >

              <div>

                <div
                  className="
                    text-sm
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-[#d8aa4c]
                  "
                >
                  Zapytanie o realizację
                </div>

                <h2
                  className="
                    mt-2
                    text-2xl
                    font-black
                  "
                >
                  Zamów ten projekt
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowOrderPanel(
                    false
                  )
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/15
                  text-xl
                "
              >
                ×
              </button>

            </div>

            <div
              className="
                mt-6
                grid
                gap-4
                sm:grid-cols-2
              "
            >

              <input
                value={
                  name
                }
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Imię i nazwisko"
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#161b22]
                  px-5
                  py-4
                  outline-none
                  focus:border-[#d8aa4c]/60
                "
              />

              <input
                value={
                  phone
                }
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                placeholder="Numer telefonu"
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#161b22]
                  px-5
                  py-4
                  outline-none
                  focus:border-[#d8aa4c]/60
                "
              />

              <input
                value={
                  city
                }
                onChange={(event) =>
                  setCity(
                    event.target.value
                  )
                }
                placeholder="Miejscowość"
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#161b22]
                  px-5
                  py-4
                  outline-none
                  focus:border-[#d8aa4c]/60
                "
              />

              <input
                value={
                  email
                }
                readOnly
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#161b22]
                  px-5
                  py-4
                  text-gray-400
                "
              />

            </div>

            <textarea
              value={
                orderMessage
              }
              onChange={(event) =>
                setOrderMessage(
                  event.target.value
                )
              }
              placeholder="Dodatkowe uwagi do realizacji..."
              className="
                mt-4
                min-h-[130px]
                w-full
                rounded-2xl
                border
                border-white/10
                bg-[#161b22]
                px-5
                py-4
                outline-none
                focus:border-[#d8aa4c]/60
              "
            />

            <button
              type="button"
              onClick={
                sendOrderRequest
              }
              className="
                mt-5
                w-full
                rounded-2xl
                bg-gradient-to-r
                from-[#d8aa4c]
                to-[#f4ca73]
                px-7
                py-4
                font-black
                text-black
                transition
                hover:brightness-110
              "
            >
              Wyślij zapytanie
            </button>

          </div>

        </div>

      )}

      {/* PODGLĄD PEŁNOEKRANOWY */}

      {selectedImage && (

        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/95
            p-4
            md:p-8
          "
          onClick={() =>
            setSelectedImage(
              null
            )
          }
        >

          <div
            className="
              relative
              flex
              max-h-[95vh]
              w-full
              max-w-7xl
              flex-col
              items-center
              gap-4
            "
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              onClick={() =>
                setSelectedImage(
                  null
                )
              }
              className="
                absolute
                right-2
                top-2
                z-10
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-full
                border
                border-white/20
                bg-black/70
                text-2xl
                font-bold
              "
            >
              ×
            </button>

            <img
              src={`data:image/png;base64,${selectedImage}`}
              alt="Powiększona wizualizacja"
              className="
                max-h-[84vh]
                max-w-full
                rounded-2xl
                object-contain
                shadow-2xl
              "
            />

            <button
              type="button"
              onClick={() =>
                downloadImage(
                  selectedImage,
                  "Projektuj-AI-wizualizacja.png"
                )
              }
              className="
                rounded-2xl
                bg-white
                px-8
                py-4
                font-bold
                text-black
                transition
                hover:bg-gray-200
              "
            >
              Pobierz zdjęcie
            </button>

          </div>

        </div>

      )}

    </main>
  );
}