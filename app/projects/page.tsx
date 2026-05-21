"use client";

import {
  useEffect,
  useState,

} from "react";

import Image from "next/image";

import { supabase }
from "@/lib/supabase";

import {
  generatePremiumPDF,
} from "@/components/PremiumPDF";

export default function ProjectsPage() {

  const [projects, setProjects] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    async function loadProjects() {

      try {

        const {

          data: { user },

        } =
          await supabase.auth.getUser();

        if (!user?.email) {

          window.location.href =
            "/login";

          return;
        }

        const { data } =
          await supabase

            .from("projects")

            .select("*")

            .eq(
              "user_email",
              user.email
            )

            .order(
              "created_at",
              {
                ascending: false,
              }
            );

        setProjects(data || []);

      } catch (err) {

        console.log(err);

      } finally {

        setLoading(false);
      }
    }

    loadProjects();

  }, []);

  function getStatusColor(
    status: string
  ) {

    if (
      status === "Gotowe"
    ) {

      return `
        bg-green-500/20
        text-green-300
        border-green-500/20
      `;
    }

    if (
      status === "Poprawki"
    ) {

      return `
        bg-yellow-500/20
        text-yellow-300
        border-yellow-500/20
      `;
    }

    if (
      status === "Projektowanie"
    ) {

      return `
        bg-blue-500/20
        text-blue-300
        border-blue-500/20
      `;
    }

    return `
      bg-white/10
      text-white
      border-white/10
    `;
  }

  return (

    <main className="
      min-h-screen
      bg-black
      text-white
      relative
      overflow-hidden
      p-6
      lg:p-10
    ">

      {/* BACKGROUND */}

      <div className="
        absolute
        inset-0
        bg-gradient-to-br
        from-black
        via-black/95
        to-blue-950/40
      " />

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
        relative
        z-10
        max-w-7xl
        mx-auto
      ">

        {/* TOPBAR */}

        <div className="
          flex
          flex-col
          lg:flex-row
          lg:items-center
          lg:justify-between
          gap-6
          mb-12
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
              font-black
            ">
              DreamS CRM
            </h1>

            <p className="
              text-gray-400
              text-xl
              mt-4
              max-w-3xl
              leading-relaxed
            ">
              Profesjonalny panel
              projektów i klientów
              DreamS AI.
            </p>

          </div>

          <div className="
            flex
            gap-4
            flex-wrap
          ">

            <button

              onClick={() =>
                window.location.href =
                  "/dashboard"
              }

              className="
                bg-white
                text-black
                hover:scale-105
                transition
                px-8
                py-5
                rounded-3xl
                font-bold
                text-lg
                shadow-2xl
              "
            >
              Nowy projekt
            </button>

          </div>

        </div>

        {/* LOADING */}

        {loading && (

          <div className="
            flex
            flex-col
            items-center
            justify-center
            py-32
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
              Ładowanie projektów...
            </div>

          </div>

        )}

        {/* EMPTY */}

        {

          !loading &&
          projects.length === 0 && (

            <div className="
              bg-white/5
              border
              border-white/10
              backdrop-blur-xl
              rounded-[40px]
              p-20
              text-center
            ">

              <div className="
                text-5xl
                mb-6
              ">
                📂
              </div>

              <h2 className="
                text-4xl
                font-bold
                mb-6
              ">
                Brak zapisanych projektów
              </h2>

              <p className="
                text-gray-400
                text-xl
                max-w-2xl
                mx-auto
                leading-relaxed
              ">
                Wygeneruj pierwszą
                wizualizację kuchni premium,
                aby pojawiła się
                w historii projektów.
              </p>

            </div>

          )
        }

        {/* PROJECTS */}

        <div className="
          grid
          md:grid-cols-2
          xl:grid-cols-3
          gap-8
        ">

          {projects.map(
            (project) => (

              <div

                key={project.id}

                onClick={() =>
                  window.location.href =
                    `/dashboard?project=${project.id}`
                }

                className="
                  bg-white/5
                  border
                  border-white/10
                  backdrop-blur-xl
                  rounded-[35px]
                  overflow-hidden
                  shadow-2xl
                  cursor-pointer
                  hover:scale-[1.02]
                  transition
                "
              >

                {

                  project.image_url && (

                    <img

                      src={`data:image/png;base64,${project.image_url}`}

                      alt="Projekt"

                      className="
                        w-full
                        h-[320px]
                        object-cover
                      "
                    />

                  )
                }

                <div className="
                  p-8
                ">

                  {/* STATUS */}

                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    mb-6
                  ">

                    <div className={`
                      px-4
                      py-2
                      rounded-2xl
                      border
                      text-sm
                      font-bold
                      ${getStatusColor(
                        project.status
                      )}
                    `}>

                      {
                        project.status ||
                        "Konsultacja"
                      }

                    </div>

                    <div className="
                      text-sm
                      text-gray-500
                    ">

                      {

                        new Date(
                          project.created_at
                        ).toLocaleDateString(
                          "pl-PL"
                        )
                      }

                    </div>

                  </div>

                  {/* CLIENT */}

                  {(project.name ||
                    project.city) && (

                    <div className="
                      mb-6
                    ">

                      {project.name && (

                        <div className="
                          text-lg
                          font-bold
                        ">
                          {project.name}
                        </div>

                      )}

                      {project.city && (

                        <div className="
                          text-gray-400
                        ">
                          {project.city}
                        </div>

                      )}

                    </div>

                  )}

                  {/* PROMPT */}

                  <div className="
                    text-xl
                    text-gray-200
                    leading-relaxed
                    whitespace-pre-wrap
                    line-clamp-6
                  ">

                    {project.prompt}

                  </div>

                  {/* FOOTER */}

                  <div className="
                    mt-8
                    flex
                    items-center
                    justify-between
                    gap-4
                  ">

                    <div className="
                      text-sm
                      text-gray-500
                    ">
                      DreamS AI
                    </div>

                    <button

                      onClick={(e) => {

                        e.stopPropagation();

                        generatePremiumPDF({
                          project,
                        });
                      }}

                      className="
                        bg-white
                        text-black
                        px-4
                        py-3
                        rounded-2xl
                        font-bold
                        hover:scale-105
                        transition
                      "
                    >
                      Pobierz PDF
                    </button>

                  </div>

                </div>

              </div>
            )
          )}

        </div>

      </div>

    </main>
  );
}