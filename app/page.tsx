"use client";

export default function Home() {

  return (

    <main className="
      bg-black
      text-white
      overflow-hidden
    ">

      {/* HERO */}

      <section className="
        relative
        min-h-screen
        overflow-hidden
        bg-black
        text-white
      ">

        {/* DESKTOP VIDEO */}

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

        <div className="
          md:hidden
          absolute
          inset-0
        ">

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

        <div className="
          absolute
          inset-0
          bg-black/60
        " />

        {/* CONTENT */}

        <div className="
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
        ">

          <div className="
            max-w-4xl
          ">

            <div className="
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
            ">

              <div className="
                w-3
                h-3
                rounded-full
                bg-green-400
              " />

              <span className="
                text-sm
                font-semibold
              ">
                AI Room Scanner aktywny
              </span>

            </div>

            <h1 className="
              text-5xl
              md:text-7xl
              font-black
              leading-tight
            ">

              DreamS AI

              <span className="
                block
                text-white/70
                mt-4
              ">
                Kuchnie tworzone przez AI
              </span>

            </h1>

            <p className="
              text-xl
              text-white/70
              mt-10
              max-w-2xl
              leading-relaxed
            ">

              Prześlij zdjęcie lub rzut pomieszczenia,
              a DreamS AI automatycznie wykryje:
              ściany, okna, drzwi, ergonomię
              i zaprojektuje realistyczną kuchnię premium.

            </p>

            {/* FEATURES */}

            <div className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-4
              mt-12
              max-w-3xl
            ">

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

                  <div className="
                    flex
                    items-center
                    gap-3
                  ">

                    <div className="
                      w-2
                      h-2
                      rounded-full
                      bg-green-400
                    " />

                    <span className="
                      font-medium
                    ">
                      {item}
                    </span>

                  </div>

                </div>
              ))}

            </div>

            {/* CTA */}

            <div className="
              flex
              flex-col
              md:flex-row
              gap-5
              mt-14
            ">

              <button

                onClick={() =>
                  window.location.href =
                    "/login"
                }

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

                  const el =
                    document.getElementById(
                      "scanner"
                    );

                  el?.scrollIntoView({
                    behavior: "smooth",
                  });
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
                "
              >
                Zobacz AI Room Scanner
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* ROOM SCANNER */}

      <section
        id="scanner"
        className="
          bg-black
          text-white
          py-32
          px-6
        "
      >

        <div className="
          max-w-7xl
          mx-auto
          grid
          md:grid-cols-2
          gap-20
          items-center
        ">

          <div>

            <div className="
              text-sm
              uppercase
              tracking-[0.3em]
              text-white/50
              mb-6
            ">
              AI ROOM SCANNER
            </div>

            <h2 className="
              text-5xl
              font-black
              leading-tight
            ">

              Skanuj pomieszczenie
              telefonem

            </h2>

            <p className="
              text-xl
              text-white/70
              mt-8
              leading-relaxed
            ">

              DreamS AI analizuje pomieszczenie,
              wykrywa ściany, okna, drzwi,
              ergonomię i automatycznie
              projektuje realistyczną kuchnię premium.

            </p>

            <div className="
              space-y-5
              mt-12
            ">

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

                  <div className="
                    w-3
                    h-3
                    rounded-full
                    bg-green-400
                  " />

                  <span className="
                    text-lg
                  ">
                    {item}
                  </span>

                </div>
              ))}

            </div>

          </div>

          <div className="
            relative
          ">

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

    </main>
  );
}