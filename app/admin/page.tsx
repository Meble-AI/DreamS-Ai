"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {

  const [clients, setClients] =
    useState<any[]>([]);

  useEffect(() => {

    async function loadClients() {

      const { data, error } =
        await supabase

          .from("orders")

          .select("*")

          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      console.log(data);
      console.log(error);

      if (data) {

        setClients(data);
      }
    }

    loadClients();

  }, []);

  return (

    <main className="
      min-h-screen
      bg-black
      text-white
      p-10
    ">

      <h1 className="
        text-5xl
        font-bold
        mb-10
      ">
        Panel Admina
      </h1>

      {clients.length === 0 && (

        <div className="
          text-red-500
          text-xl
        ">
          Brak klientów w bazie.
        </div>

      )}

      <div className="
        grid
        gap-6
      ">

        {clients.map((client) => (

          <div

            key={client.id}

            className="
              bg-gray-900
              border
              border-gray-800
              rounded-3xl
              p-6
            "
          >

            <div className="
              text-3xl
              font-bold
              mb-4
            ">
              {client.name || "Brak imienia"}
            </div>

            <div className="
              space-y-2
              text-gray-300
              text-lg
            ">

              <div>
                📞 {client.phone || "-"}
              </div>

              <div>
                📧 {client.email || "-"}
              </div>

              <div>
                📍 {client.city || "-"}
              </div>

              <div className="
                pt-4
              ">
                💬 {client.description || "-"}
              </div>

            </div>

            {client.image && (

              <img

                src={client.image}

                alt="projekt"

                className="
                  mt-6
                  rounded-3xl
                  w-full
                  max-w-xl
                  border
                  border-gray-700
                "
              />

            )}

            {client.generated_image && (

              <img

                src={`data:image/png;base64,${client.generated_image}`}

                alt="wizualizacja-ai"

                className="
                  mt-6
                  rounded-3xl
                  w-full
                  max-w-xl
                  border
                  border-blue-500
                "
              />

            )}

            <div className="
              mt-6
              text-sm
              text-gray-500
            ">
              {client.created_at}
            </div>

          </div>

        ))}

      </div>

    </main>
  );
}