"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  supabase,
} from "@/lib/supabase";

type Order = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  description?: string | null;
  image?: string | null;
  generated_image?: string | null;
  created_at?: string | null;
  status?: string | null;
  project_id?: string | null;
  version_number?: number | null;
};

export default function AdminPage() {

  const [clients, setClients] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("Wszystkie");

  const filteredClients =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      return clients.filter(
        (client) => {

          const matchesSearch =
            !query ||

            [
              client.name,
              client.phone,
              client.email,
              client.city,
              client.description,
              client.project_id,
            ]
              .filter(Boolean)
              .some(
                (value) =>
                  String(value)
                    .toLowerCase()
                    .includes(query)
              );

          const currentStatus =
            client.status ||
            "Nowe";

          const matchesStatus =
            statusFilter ===
              "Wszystkie" ||

            currentStatus ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [
      clients,
      search,
      statusFilter,
    ]);

  async function loadClients() {

    try {

      setLoading(true);
      setErrorMessage("");

      const {
        data,
        error,
      } =
        await supabase

          .from("orders")

          .select("*")

          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (error) {

        console.error(
          "LOAD ORDERS ERROR:",
          error
        );

        setErrorMessage(
          error.message ||
          "Nie udało się pobrać zamówień."
        );

        return;
      }

      setClients(
        (data || []) as Order[]
      );

    } catch (error) {

      console.error(
        "ADMIN LOAD ERROR:",
        error
      );

      setErrorMessage(
        "Nie udało się połączyć z bazą."
      );

    } finally {

      setLoading(false);
    }
  }

  useEffect(() => {

    loadClients();

  }, []);

  async function updateStatus(
    orderId: string,
    status: string
  ) {

    const {
      error,
    } =
      await supabase

        .from("orders")

        .update({
          status,
        })

        .eq(
          "id",
          orderId
        );

    if (error) {

      console.error(
        "STATUS UPDATE ERROR:",
        error
      );

      alert(
        "Nie udało się zmienić statusu."
      );

      return;
    }

    setClients(
      (current) =>
        current.map(
          (client) =>
            client.id === orderId
              ? {
                  ...client,
                  status,
                }
              : client
        )
    );
  }

  async function deleteOrder(
    orderId: string
  ) {

    const confirmed =
      window.confirm(
        "Czy na pewno chcesz usunąć to zamówienie?"
      );

    if (!confirmed)
      return;

    const {
      error,
    } =
      await supabase

        .from("orders")

        .delete()

        .eq(
          "id",
          orderId
        );

    if (error) {

      console.error(
        "DELETE ORDER ERROR:",
        error
      );

      alert(
        "Nie udało się usunąć zamówienia."
      );

      return;
    }

    setClients(
      (current) =>
        current.filter(
          (client) =>
            client.id !== orderId
        )
    );
  }

  function formatDate(
    value?: string | null
  ) {

    if (!value)
      return "-";

    return new Date(
      value
    ).toLocaleString(
      "pl-PL"
    );
  }

  function getStatusClasses(
    status?: string | null
  ) {

    const value =
      status ||
      "Nowe";

    if (
      value === "Nowe"
    ) {

      return "border-blue-500/25 bg-blue-500/10 text-blue-300";
    }

    if (
      value === "W kontakcie"
    ) {

      return "border-[#d8aa4c]/30 bg-[#d8aa4c]/10 text-[#f0c56e]";
    }

    if (
      value === "Wycena"
    ) {

      return "border-purple-500/25 bg-purple-500/10 text-purple-300";
    }

    if (
      value === "Realizacja"
    ) {

      return "border-orange-500/25 bg-orange-500/10 text-orange-300";
    }

    if (
      value === "Zakończone"
    ) {

      return "border-green-500/25 bg-green-500/10 text-green-300";
    }

    return "border-white/10 bg-white/[0.04] text-gray-300";
  }

  return (

    <main
      className="
        min-h-screen
        bg-[#07090d]
        px-4
        py-8
        text-white
        sm:px-6
        lg:px-8
      "
    >

      <div
        className="
          mx-auto
          max-w-7xl
        "
      >

        <div
          className="
            flex
            flex-col
            gap-6
            border-b
            border-white/10
            pb-7
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >

          <div>

            <div
              className="
                text-sm
                font-semibold
                uppercase
                tracking-[0.2em]
                text-[#d8aa4c]
              "
            >
              Projektuj AI
            </div>

            <h1
              className="
                mt-3
                text-4xl
                font-black
                tracking-tight
                sm:text-5xl
              "
            >
              Panel administratora
            </h1>

            <p
              className="
                mt-3
                max-w-2xl
                text-lg
                leading-8
                text-gray-400
              "
            >
              Zamówienia, dane klientów i projekty przesłane do realizacji.
            </p>

          </div>

          <button
            type="button"
            onClick={
              loadClients
            }
            className="
              rounded-2xl
              border
              border-[#d8aa4c]/35
              bg-[#d8aa4c]/10
              px-6
              py-4
              font-bold
              text-[#f0c56e]
              transition
              hover:bg-[#d8aa4c]/20
            "
          >
            Odśwież dane
          </button>

        </div>

        <div
          className="
            mt-7
            grid
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >

          <div
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
                text-sm
                text-gray-500
              "
            >
              Wszystkie zamówienia
            </div>

            <div
              className="
                mt-2
                text-3xl
                font-black
              "
            >
              {clients.length}
            </div>

          </div>

          <div
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
                text-sm
                text-gray-500
              "
            >
              Nowe
            </div>

            <div
              className="
                mt-2
                text-3xl
                font-black
                text-blue-300
              "
            >
              {
                clients.filter(
                  (client) =>
                    (
                      client.status ||
                      "Nowe"
                    ) === "Nowe"
                ).length
              }
            </div>

          </div>

          <div
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
                text-sm
                text-gray-500
              "
            >
              W realizacji
            </div>

            <div
              className="
                mt-2
                text-3xl
                font-black
                text-orange-300
              "
            >
              {
                clients.filter(
                  (client) =>
                    client.status ===
                    "Realizacja"
                ).length
              }
            </div>

          </div>

          <div
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
                text-sm
                text-gray-500
              "
            >
              Zakończone
            </div>

            <div
              className="
                mt-2
                text-3xl
                font-black
                text-green-300
              "
            >
              {
                clients.filter(
                  (client) =>
                    client.status ===
                    "Zakończone"
                ).length
              }
            </div>

          </div>

        </div>

        <div
          className="
            mt-7
            grid
            gap-4
            rounded-3xl
            border
            border-white/10
            bg-[#0c1016]
            p-5
            md:grid-cols-[1fr_240px]
          "
        >

          <input
            value={
              search
            }
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Szukaj po nazwisku, e-mailu, telefonie, mieście lub ID projektu..."
            className="
              min-h-[56px]
              rounded-2xl
              border
              border-white/10
              bg-[#161b22]
              px-5
              text-white
              outline-none
              placeholder:text-gray-600
              focus:border-[#d8aa4c]/60
            "
          />

          <select
            value={
              statusFilter
            }
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="
              min-h-[56px]
              rounded-2xl
              border
              border-white/10
              bg-[#161b22]
              px-5
              text-white
              outline-none
              focus:border-[#d8aa4c]/60
            "
          >

            {[
              "Wszystkie",
              "Nowe",
              "W kontakcie",
              "Wycena",
              "Realizacja",
              "Zakończone",
            ].map(
              (status) => (

                <option
                  key={
                    status
                  }
                  value={
                    status
                  }
                >
                  {status}
                </option>

              )
            )}

          </select>

        </div>

        {loading && (

          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              py-24
            "
          >

            <div
              className="
                h-16
                w-16
                animate-spin
                rounded-full
                border-4
                border-[#d8aa4c]
                border-t-transparent
              "
            />

            <div
              className="
                mt-6
                text-xl
                font-bold
              "
            >
              Ładowanie zamówień...
            </div>

          </div>

        )}

        {!loading &&
          errorMessage && (

            <div
              className="
                mt-8
                rounded-2xl
                border
                border-red-500/25
                bg-red-500/10
                p-5
                text-red-300
              "
            >
              {errorMessage}
            </div>

          )}

        {!loading &&
          !errorMessage &&
          filteredClients.length === 0 && (

            <div
              className="
                mt-8
                rounded-[28px]
                border
                border-white/10
                bg-[#0c1016]
                p-12
                text-center
              "
            >

              <div
                className="
                  text-5xl
                "
              >
                📂
              </div>

              <h2
                className="
                  mt-5
                  text-2xl
                  font-black
                "
              >
                Brak zamówień
              </h2>

              <p
                className="
                  mt-3
                  text-gray-400
                "
              >
                Zamówienia przesłane przez klientów pojawią się w tym miejscu.
              </p>

            </div>

          )}

        <div
          className="
            mt-8
            grid
            gap-6
          "
        >

          {filteredClients.map(
            (client) => {

              const status =
                client.status ||
                "Nowe";

              return (

                <article

                  key={
                    client.id
                  }

                  className="
                    overflow-hidden
                    rounded-[28px]
                    border
                    border-white/10
                    bg-[#0c1016]
                    shadow-2xl
                  "
                >

                  <div
                    className="
                      grid
                      lg:grid-cols-[1fr_420px]
                    "
                  >

                    <div
                      className="
                        p-6
                        sm:p-8
                      "
                    >

                      <div
                        className="
                          flex
                          flex-col
                          gap-4
                          sm:flex-row
                          sm:items-start
                          sm:justify-between
                        "
                      >

                        <div>

                          <h2
                            className="
                              text-2xl
                              font-black
                            "
                          >
                            {
                              client.name ||
                              "Brak imienia"
                            }
                          </h2>

                          <div
                            className="
                              mt-2
                              text-sm
                              text-gray-500
                            "
                          >
                            {
                              formatDate(
                                client.created_at
                              )
                            }
                          </div>

                        </div>

                        <div
                          className={`
                            inline-flex
                            w-fit
                            rounded-full
                            border
                            px-4
                            py-2
                            text-sm
                            font-bold
                            ${getStatusClasses(
                              status
                            )}
                          `}
                        >
                          {status}
                        </div>

                      </div>

                      <div
                        className="
                          mt-6
                          grid
                          gap-4
                          sm:grid-cols-2
                        "
                      >

                        <div
                          className="
                            rounded-2xl
                            border
                            border-white/10
                            bg-white/[0.03]
                            p-4
                          "
                        >
                          <div className="text-xs uppercase tracking-[0.16em] text-gray-600">
                            Telefon
                          </div>

                          <div className="mt-2 font-semibold">
                            {client.phone || "-"}
                          </div>
                        </div>

                        <div
                          className="
                            rounded-2xl
                            border
                            border-white/10
                            bg-white/[0.03]
                            p-4
                          "
                        >
                          <div className="text-xs uppercase tracking-[0.16em] text-gray-600">
                            E-mail
                          </div>

                          <div className="mt-2 break-all font-semibold">
                            {client.email || "-"}
                          </div>
                        </div>

                        <div
                          className="
                            rounded-2xl
                            border
                            border-white/10
                            bg-white/[0.03]
                            p-4
                          "
                        >
                          <div className="text-xs uppercase tracking-[0.16em] text-gray-600">
                            Miejscowość
                          </div>

                          <div className="mt-2 font-semibold">
                            {client.city || "-"}
                          </div>
                        </div>

                        <div
                          className="
                            rounded-2xl
                            border
                            border-white/10
                            bg-white/[0.03]
                            p-4
                          "
                        >
                          <div className="text-xs uppercase tracking-[0.16em] text-gray-600">
                            Wersja projektu
                          </div>

                          <div className="mt-2 font-semibold">
                            {
                              client.version_number
                                ? `v${client.version_number}`
                                : "-"
                            }
                          </div>
                        </div>

                      </div>

                      <div
                        className="
                          mt-5
                          rounded-2xl
                          border
                          border-white/10
                          bg-white/[0.03]
                          p-5
                        "
                      >

                        <div
                          className="
                            text-xs
                            uppercase
                            tracking-[0.16em]
                            text-gray-600
                          "
                        >
                          Opis i uwagi
                        </div>

                        <div
                          className="
                            mt-3
                            whitespace-pre-wrap
                            leading-7
                            text-gray-300
                          "
                        >
                          {
                            client.description ||
                            "-"
                          }
                        </div>

                      </div>

                      {
                        client.project_id && (

                          <button
                            type="button"
                            onClick={() =>
                              window.location.href =
                                `/dashboard?project=${client.project_id}`
                            }
                            className="
                              mt-5
                              rounded-2xl
                              bg-gradient-to-r
                              from-[#d8aa4c]
                              to-[#f4ca73]
                              px-6
                              py-4
                              font-black
                              text-black
                              transition
                              hover:brightness-110
                            "
                          >
                            Otwórz projekt
                          </button>

                        )
                      }

                      <div
                        className="
                          mt-6
                          flex
                          flex-col
                          gap-3
                          sm:flex-row
                        "
                      >

                        <select
                          value={
                            status
                          }
                          onChange={(event) =>
                            updateStatus(
                              client.id,
                              event.target.value
                            )
                          }
                          className="
                            min-h-[52px]
                            flex-1
                            rounded-2xl
                            border
                            border-white/10
                            bg-[#161b22]
                            px-4
                            text-white
                            outline-none
                          "
                        >

                          {[
                            "Nowe",
                            "W kontakcie",
                            "Wycena",
                            "Realizacja",
                            "Zakończone",
                          ].map(
                            (value) => (

                              <option
                                key={
                                  value
                                }
                                value={
                                  value
                                }
                              >
                                {value}
                              </option>

                            )
                          )}

                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            deleteOrder(
                              client.id
                            )
                          }
                          className="
                            rounded-2xl
                            border
                            border-red-500/25
                            bg-red-500/10
                            px-6
                            py-4
                            font-bold
                            text-red-300
                            transition
                            hover:bg-red-500/20
                          "
                        >
                          Usuń
                        </button>

                      </div>

                    </div>

                    <div
                      className="
                        border-t
                        border-white/10
                        bg-black/25
                        p-5
                        lg:border-l
                        lg:border-t-0
                      "
                    >

                      {
                        client.generated_image ? (

                          <img
                            src={`data:image/png;base64,${client.generated_image}`}
                            alt="Wizualizacja AI"
                            className="
                              h-full
                              max-h-[620px]
                              w-full
                              rounded-2xl
                              object-contain
                            "
                          />

                        ) : client.image ? (

                          <img
                            src={
                              client.image
                            }
                            alt="Projekt klienta"
                            className="
                              h-full
                              max-h-[620px]
                              w-full
                              rounded-2xl
                              object-contain
                            "
                          />

                        ) : (

                          <div
                            className="
                              flex
                              min-h-[300px]
                              items-center
                              justify-center
                              rounded-2xl
                              border
                              border-dashed
                              border-white/10
                              text-center
                              text-gray-600
                            "
                          >
                            Brak zapisanej wizualizacji
                          </div>

                        )
                      }

                    </div>

                  </div>

                </article>

              );
            }
          )}

        </div>

      </div>

    </main>
  );
}