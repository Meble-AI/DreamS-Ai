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

        const {
          data,
          error,
        } =
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
                ascending:
                  false,
              }
            );

        if (
          error
        ) {

          console.error(
            "LOAD PROJECTS ERROR:",
            error
          );

          alert(
            `Nie udało się pobrać historii projektów: ${error.message}`
          );

          setProjects(
            []
          );

          return;
        }

        setProjects(
          data ||
          []
        );

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

    if (
      status === "Zapisany"
    ) {

      return `
        bg-[#d8aa4c]/15
        text-[#f0c56e]
        border-[#d8aa4c]/30
      `;
    }

    return `
      bg-white/10
      text-white
      border-white/10
    `;
  }


  function getProjectMeta(
    project: any
  ) {

    const conversation =
      Array.isArray(
        project?.conversation
      )
        ? project.conversation
        : [];

    return (
      conversation.find(
        (
          item: any
        ) =>
          item?.__dreamsProjectMeta ===
          true
      ) ||
      null
    );
  }

  function getProjectStatus(
    project: any
  ) {

    return (
      getProjectMeta(
        project
      )?.status ||
      "Zapisany"
    );
  }

  return (
    <main className="min-h-screen bg-[#07090d] text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Image src="/logo.png" alt="Projektuj AI" width={220} height={80} className="mb-4 h-auto w-[210px]" />
            <div className="text-sm uppercase tracking-[0.2em] text-[#d8aa4c] font-semibold">Historia projektów</div>
            <h1 className="mt-3 text-5xl font-black">Moje projekty</h1>
            <p className="mt-3 max-w-2xl text-lg text-gray-400">Tu znajdziesz projekty zapisane na później. Możesz je otworzyć i kontynuować dokładnie od miejsca, w którym skończyłeś.</p>
          </div>
          <button onClick={()=>window.location.href="/dashboard"} className="rounded-2xl bg-gradient-to-r from-[#d8aa4c] to-[#f4ca73] px-7 py-4 font-bold text-black hover:brightness-110">
            + Nowy projekt
          </button>
        </div>

        {loading && (
          <div className="py-24 text-center">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-[#d8aa4c] border-t-transparent"></div>
            <div className="mt-6 text-2xl font-bold">Ładowanie projektów...</div>
          </div>
        )}

        {!loading && projects.length===0 && (
          <div className="rounded-[32px] border border-white/10 bg-[#0c1016] p-16 text-center">
            <div className="text-6xl">📁</div>
            <h2 className="mt-5 text-3xl font-black">Nie masz jeszcze projektów</h2>
            <p className="mt-4 text-gray-400">Kliknij „Zapisz na później” w swoim projekcie, a pojawi się tutaj i będzie można do niego wrócić.</p>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(project=>(
            <div key={project.id}
              onClick={()=>{
                localStorage.setItem(
                  "dreams_last_project",
                  project.id
                );
                window.location.href=`/dashboard?project=${project.id}`;
              }}
              className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1016] cursor-pointer transition hover:-translate-y-1 hover:border-[#d8aa4c]/40">
              {project.image_url && (
                <img
                  src={
                    String(
                      project.image_url
                    ).startsWith(
                      "data:image/"
                    )
                      ? project.image_url
                      : `data:image/png;base64,${project.image_url}`
                  }
                  alt="Podgląd projektu"
                  className="h-[300px] w-full object-cover"
                />
              )}
              <div className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span className={`rounded-xl border px-4 py-2 text-sm font-bold ${getStatusColor(getProjectStatus(project))}`}>
                    {
                      getProjectStatus(
                        project
                      ) ===
                      "Zapisany"
                        ? "Zapisany na później"
                        : getProjectStatus(
                            project
                          )
                    }
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(
                      project.created_at
                    ).toLocaleDateString(
                      "pl-PL"
                    )}
                  </span>
                </div>

                {(() => {
                  const contact =
                    getProjectMeta(project)?.contact || {};

                  if (!contact.name && !contact.city) {
                    return null;
                  }

                  return (
                    <div className="mb-4">
                      {contact.name && (
                        <div className="font-bold text-lg">
                          {contact.name}
                        </div>
                      )}

                      {contact.city && (
                        <div className="text-gray-400">
                          {contact.city}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="line-clamp-5 whitespace-pre-wrap text-gray-300">
                  {project.prompt}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={(e)=>{
                      e.stopPropagation();
                      localStorage.setItem(
                        "dreams_last_project",
                        project.id
                      );
                      window.location.href=`/dashboard?project=${project.id}`;
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#d8aa4c] to-[#f4ca73] py-3 font-bold text-black">
                    Wznów projekt
                  </button>

                  <button
                    onClick={(e)=>{
                      e.stopPropagation();
                      generatePremiumPDF({project});
                    }}
                    className="rounded-xl border border-white/15 px-5 py-3 font-semibold hover:bg-white/5">
                    PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
