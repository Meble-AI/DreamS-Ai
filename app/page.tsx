"use client";

export default function Home() {

  return (

    <main
      className="
        bg-black
        text-white
        overflow-hidden
      "
    >

      {/* HERO */}

      <section
        className="
          relative
          min-h-screen
          overflow-hidden
          bg-black
          text-white
        "
      >

        {/* VIDEO DESKTOP */}

        <video
          autoPlay
          muted
          loop
          playsInline
          className="
            hidden
            md:block
            absolute
            inset-0
            w-full
            h-full
            object-cover
            opacity-40
          "
        >

          <source
            src="/kitchen.mp4"
            type="video/mp4"
          />

        </video>

        {/* MOBILE IMAGE */}

        <div
          className="
            md:hidden
            absolute
            inset-0
          "
        >

          <img
            src="/mobile-kitchen.jpg"
            alt=""
            className="
              w-full
              h-full
              object-cover
              opacity-40
            "
          />

        </div>

        {/* OVERLAY */}

        <div
          className="
            absolute
            inset-0
            bg-black/60
          "
        />

        {/* CONTENT */}

        <div
          className="
            relative
            z-10
            max-w-7xl
            mx-auto
            px-6
            py-24
            flex
            flex-col
            justify-center
            min-h-screen
          "
        >

          <div
            className="
              max-w-4xl
            "
          >

            {/* BADGE */}

            <div
              className="
                inline-flex
                items-center
                gap-3
                bg-white/10
                border
                border-white/10
                rounded-full
                px-5
                py-3
                mb-8
                backdrop-blur-xl
              "
            >

              <div
                className="
                  w-3
                  h-3
                  rounded-full
                  bg-green-400
                "
              />

              <span
                className="
                  text-sm
                  font-semibold
                "
              >
                AI Room Scanner aktywny
              </span>

            </div>

            {/* TITLE */}

            <h1
              className="
                text-5xl
                md:text-7xl
                font-black
                leading-tight
              "
            >

              DreamS AI

              <span
                className="
                  block
                  text-white/70
                  mt-4
                "
              >
                Kuchnie tworzone przez AI
              </span>

            </h1>

            {/* DESCRIPTION */}

            <p
              className="
                text-xl
                text-white/70
                mt-10
                max-w-2xl
                leading-relaxed
              "
            >

              Prześlij zdjęcie lub rzut pomieszczenia,
              a DreamS AI automatycznie wykryje:
              ściany, okna, drzwi, ergonomię
              i zaprojektuje realistyczną kuchnię premium.

            </p>

            {/* FEATURES */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-4
                mt-12
                max-w-3xl
              "
            >

              {[
                "AI Room Scanner",
                "Automatyczna analiza pomieszczenia",
                "Fotorealistyczne wizualizacje",
                "Rzuty 2D",
                "Szacunkowa wycena",
                "Edycja projektu AI",
              ].map((item) => (

                <div
                  key={item}
                  className="
                    bg-white/10
                    border
                    border-white/10
                    rounded-2xl
                    px-5
                    py-4
                    backdrop-blur-xl
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >

                    <div
                      className="
                        w-2
                        h-2
                        rounded-full
                        bg-green-400
                      "
                    />

                    <span
                      className="
                        font-medium
                      "
                    >
                      {item}
                    </span>

                  </div>

                </div>
              ))}

            </div>

            {/* BUTTONS */}

            <div
              className="
                flex
                flex-col
                md:flex-row
                gap-5
                mt-14
              "
            >

              <button

                onClick={() => {
                  window.location.href =
                    "/register";
                }}

                className="
                  bg-white
                  text-black
                  px-10
                  py-5
                  rounded-2xl
                  font-bold
                  text-lg
                  hover:scale-[1.02]
                  transition
                "
              >
                Rozpocznij projekt
              </button>

              <button

                onClick={() => {
                  window.location.href =
                    "/pricing";
                }}

                className="
                  bg-white/10
                  border
                  border-white/20
                  px-10
                  py-5
                  rounded-2xl
                  font-bold
                  text-lg
                  backdrop-blur-xl
                  hover:bg-white/20
                  transition
                "
              >
                Zobacz pakiety
              </button>

            </div>

          </div>

        </div>

      </section>

{/* ROOM SCANNER SECTION */}

<section
  id="scanner"
  className="
    bg-black
    text-white
    py-32
    px-6
  "
>

  <div
    className="
      max-w-7xl
      mx-auto
      grid
      md:grid-cols-2
      gap-20
      items-center
    "
  >

    {/* LEFT */}

    <div>

      <div
        className="
          text-sm
          uppercase
          tracking-[0.3em]
          text-white/50
          mb-6
        "
      >
        AI ROOM SCANNER
      </div>

      <h2
        className="
          text-5xl
          font-black
          leading-tight
        "
      >

        Skanuj pomieszczenie
        telefonem

      </h2>

      <p
        className="
          text-xl
          text-white/70
          mt-8
          leading-relaxed
        "
      >

        DreamS AI analizuje pomieszczenie,
        wykrywa ściany, okna, drzwi,
        ergonomię i automatycznie
        projektuje realistyczną kuchnię premium.

      </p>

      <div
        className="
          space-y-5
          mt-12
        "
      >

        {[
          "Wykrywanie ścian i układu",
          "Analiza miejsca na wyspę",
          "Automatyczna ergonomia",
          "Rzeczywiste proporcje",
          "Projekt możliwy do wykonania",
        ].map((item) => (

          <div
            key={item}
            className="
              flex
              items-center
              gap-4
            "
          >

            <div
              className="
                w-3
                h-3
                rounded-full
                bg-green-400
              "
            />

            <span
              className="
                text-lg
              "
            >
              {item}
            </span>

          </div>
        ))}

      </div>

      <button

        onClick={() => {
          window.location.href =
            "/login?redirect=room-scanner";
        }}

        className="
          mt-12
          bg-green-600
          hover:bg-green-500
          transition
          px-10
          py-5
          rounded-2xl
          font-bold
          text-lg
          text-white
        "
      >
        Uruchom AI Room Scanner
      </button>

    </div>

    {/* RIGHT */}

    <div
      className="
        relative
      "
    >

      <img
        src="/scanner-preview.jpg"
        alt=""
        className="
          rounded-[40px]
          shadow-2xl
          border
          border-white/10
        "
      />

    </div>

  </div>

</section>

      {/* FOOTER */}

      <footer
        className="
          border-t
          border-white/10
          py-16
          px-6
          bg-black
        "
      >

        <div
          className="
            max-w-7xl
            mx-auto
            grid
            md:grid-cols-3
            gap-12
          "
        >

          <div>

           <img
  src="/logo 1.png"
  alt="DreamS AI"
  className="
    h-16
    w-auto
    mb-4
  "
/>

            <p
              className="
                text-white/60
                leading-relaxed
              "
            >
              Inteligentne projektowanie
              kuchni premium z pomocą AI.
            </p>

          </div>

          <div>

            <div
              className="
                font-bold
                mb-5
              "
            >
              Nawigacja
            </div>

            <div
              className="
                flex
                flex-col
                gap-3
                text-white/70
              "
            >

              <a href="/pricing">
                Cennik
              </a>

              <a href="/login">
                Logowanie
              </a>

              <a href="/register">
                Rejestracja
              </a>

              <a href="/reset-password">
                Reset hasła
              </a>

            </div>

          </div>

          <div>

            <div
              className="
                font-bold
                mb-5
              "
            >
              Informacje
            </div>

            <div
              className="
                flex
                flex-col
                gap-3
                text-white/70
              "
            >

              <a href="/privacy-policy">
                Polityka prywatności
              </a>

              <a href="/terms">
                Regulamin
              </a>

              <a href="/cookies">
                Pliki cookies
              </a>

            </div>

          </div>

        </div>

      </footer>

    </main>
  );
}