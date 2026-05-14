"use client";

import { useEffect, useState }
from "react";

import { supabase }
from "@/lib/supabase";

export default function ProjectsPage() {

  const [projects, setProjects] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  // =========================
  // LOAD PROJECTS
  // =========================

  useEffect(() => {

    async function loadProjects() {

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session) {

        window.location.href =
          "/login";

        return;
      }

      const email =
        session.user.email;

      const { data } =
        await supabase

          .from("projects")

          .select("*")

          .eq(
            "user_email",
            email
          )

          .order(
            "created_at",

            {
              ascending: false,
            }
          );

      setProjects(
        data || []
      );

      setLoading(false);
    }

    loadProjects();

  }, []);

  // =========================
  // LOADING
  // =========================

  if (loading) {

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
          Ładowanie projektów...
        </div>

      </main>
    );
  }

  // =========================
  // PAGE
  // =========================

  return (

    <main className="
      min-h-screen
      bg-black
      text-white
      p-8
    ">

      <div className="
        max-w-6xl
        mx-auto
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
              mb-2
            ">
              Moje Projekty
            </h1>

            <p className="
              text-gray-400
            ">
              Historia projektów DreamS AI
            </p>

          </div>

          <button

            onClick={() =>
              window.location.href =
                "/"
            }

            className="
              bg-white
              text-black
              px-6
              py-3
              rounded-2xl
              font-bold
            "
          >
            Wróć
          </button>

        </div>

        {projects.length === 0 && (

          <div className="
            text-center
            text-gray-400
            mt-20
          ">
            Brak projektów
          </div>

        )}

        <div className="
          grid
          md:grid-cols-2
          xl:grid-cols-3
          gap-6
        ">

          {projects.map(
            (project) => (

              <div

                key={project.id}

                className="
                  bg-gray-900
                  rounded-3xl
                  overflow-hidden
                  border
                  border-gray-800
                "
              >

                {project.generated_image && (

                  <img

                    src={`data:image/png;base64,${project.generated_image}`}

                    alt="project"

                    className="
                      w-full
                      h-64
                      object-cover
                    "
                  />

                )}

                <div className="
                  p-6
                ">

                  <h2 className="
                    text-2xl
                    font-bold
                    mb-2
                  ">
                    {project.project_name}
                  </h2>

                  <div className="
                    text-gray-400
                    text-sm
                    mb-4
                  ">

                    {new Date(
                      project.created_at
                    ).toLocaleDateString()}

                  </div>

                  <div className="
                    space-y-2
                    mb-6
                  ">

                    <div>
                      Netto:
                      {" "}
                      <span className="
                        font-bold
                      ">
                        {project.estimate_netto || 0} zł
                      </span>
                    </div>

                    <div>
                      Brutto:
                      {" "}
                      <span className="
                        font-bold
                      ">
                        {project.estimate_brutto || 0} zł
                      </span>
                    </div>

                  </div>

                  <button

                    onClick={() => {

                      localStorage.setItem(

                        "dreams-project",

                        JSON.stringify(
                          project
                        )
                      );

                      window.location.href =
                        "/";
                    }}

                    className="
                      w-full
                      bg-blue-600
                      hover:bg-blue-700
                      transition
                      py-3
                      rounded-2xl
                      font-bold
                    "
                  >
                    Otwórz projekt
                  </button>

                </div>

              </div>
            )
          )}

        </div>

      </div>

    </main>
  );
}