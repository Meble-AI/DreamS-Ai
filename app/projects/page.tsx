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
        bg-[#d8aa4c]/15
        text-[#f0c56e]
        border-[#d8aa4c]/25
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
      bg-white/[0.05]
      text-gray-200
      border-white/10
    `;
  }

  return (

    <main className="
      min-h-screen
      bg-[#07090d]
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
        from-[#07090d]
        via-[#090c11]
        to-[#15110a]
      " />

      {/* GLOW */}

      <div className="
        absolute
        top-0
        left-0
        w-[700px]
        h-[700px]
        bg-[#d8aa4c]/15
        blur-[180px]
        rounded-full
      " />

      <div className="
        absolute
        bottom-0
        right-0
        w-[600px]
        h-[600px]
        bg-[#f0c56e]/10
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
              alt="Projektuj AI"
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
              Moje projekty
            </h1>

            <p className="
              text-gray-400
              text-xl
              mt-4
              max-w-3xl
              leading-relaxed
            ">
              Wszystkie zapisane wizualizacje
              i projekty Projektuj AI
              w jednym miejscu.
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
                bg-gradient-to-r
                from-[#d8aa4c]
                to-[#f4ca73]
                text-black
                hover:brightness-110
                transition
                px-8
                py-5
                rounded-2xl
                font-bold
                text-lg
                shadow-2xl
              "
            >
              + Nowy projekt
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
              bg-[#0c1016]/95
              border
              border-white/10
              backdrop-blur-xl
              rounded-[32px]
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
                Utwórz pierwszy projekt,
                aby pojawił się
                w historii Projektuj AI.
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
                  bg-[#0c1016]/95
                  border
                  border-white/10
                  backdrop-blur-xl
                  rounded-[28px]
                  overflow-hidden
                  shadow-2xl
                  cursor-pointer
                  hover:-translate-y-1
                  hover:border-[#d8aa4c]/40
                  transition
                  duration-300
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
                      Projektuj AI
                    </div>

                    <button

                      onClick={(e) => {

                        e.stopPropagation();

                        generatePremiumPDF({
                          project,
                        });
                      }}

                      className="
                        border
                        border-white/15
                        bg-white/[0.04]
                        text-white
                        px-4
                        py-3
                        rounded-xl
                        font-bold
                        hover:bg-white/[0.08]
                        transition
                      "
                    >
                      PDF
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