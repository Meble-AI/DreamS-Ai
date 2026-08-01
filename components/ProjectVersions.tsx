"use client";

import {
  useMemo,
  useState,
} from "react";

type ProjectVersionItem = {
  user?: string;
  ai?: string;
  generatedImage?: string;
  generatedImages?: string[];
  isCorrection?: boolean;
  createdAt?: string;
};

type ProjectVersionsProps = {
  chat?: ProjectVersionItem[];
};

export default function ProjectVersions({

  chat = [],

}: ProjectVersionsProps) {

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [compareMode, setCompareMode] =
    useState(false);

  const [firstVersion, setFirstVersion] =
    useState<number | null>(null);

  const [secondVersion, setSecondVersion] =
    useState<number | null>(null);

  const versions =
    useMemo(() => {

      return chat
        .map(
          (
            item,
            index
          ) => {

            const image =
              item.generatedImage ||

              item.generatedImages?.[0] ||

              null;

            if (!image) {
              return null;
            }

            return {

              item,

              index,

              image,

              versionNumber:
                index + 1,
            };
          }
        )
        .filter(Boolean) as {

          item:
            ProjectVersionItem;

          index:
            number;

          image:
            string;

          versionNumber:
            number;

        }[];

    }, [chat]);

  if (!versions.length)
    return null;

  function downloadImage(
    image:
      string,

    versionNumber:
      number
  ) {

    try {

      const link =
        document.createElement(
          "a"
        );

      link.href =
        `data:image/png;base64,${image}`;

      link.download =
        `Projektuj-AI-wersja-${versionNumber}.png`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

    } catch (error) {

      console.log(
        "DOWNLOAD VERSION ERROR:",
        error
      );
    }
  }

  function toggleVersionForCompare(
    versionNumber:
      number
  ) {

    if (
      firstVersion === versionNumber
    ) {

      setFirstVersion(
        null
      );

      return;
    }

    if (
      secondVersion === versionNumber
    ) {

      setSecondVersion(
        null
      );

      return;
    }

    if (
      firstVersion === null
    ) {

      setFirstVersion(
        versionNumber
      );

      return;
    }

    if (
      secondVersion === null
    ) {

      setSecondVersion(
        versionNumber
      );

      return;
    }

    setFirstVersion(
      secondVersion
    );

    setSecondVersion(
      versionNumber
    );
  }

  const firstComparedVersion =
    versions.find(
      (version) =>
        version.versionNumber ===
        firstVersion
    );

  const secondComparedVersion =
    versions.find(
      (version) =>
        version.versionNumber ===
        secondVersion
    );

  return (

    <div
      className="
        mb-10
        rounded-[28px]
        border
        border-white/10
        bg-[#0c1016]
        p-5
        shadow-2xl
        sm:p-6
      "
    >

      <div
        className="
          flex
          flex-col
          gap-5
          lg:flex-row
          lg:items-center
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
            Historia wersji
          </div>

          <div
            className="
              mt-2
              text-2xl
              font-black
            "
          >
            Historia projektu
          </div>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-gray-400
            "
          >
            Otwórz, pobierz albo porównaj dwie wersje wizualizacji.
          </p>

        </div>

        <button

          type="button"

          onClick={() => {

            setCompareMode(
              !compareMode
            );

            setFirstVersion(
              null
            );

            setSecondVersion(
              null
            );
          }}

          className="
            rounded-xl
            border
            border-[#d8aa4c]/40
            bg-[#d8aa4c]/10
            px-5
            py-3
            font-bold
            text-[#f0c56e]
            transition
            hover:bg-[#d8aa4c]/20
          "
        >
          {
            compareMode
              ? "Zakończ porównywanie"
              : "Porównaj wersje"
          }
        </button>

      </div>

      {compareMode && (

        <div
          className="
            mt-6
            rounded-2xl
            border
            border-[#d8aa4c]/20
            bg-[#d8aa4c]/5
            p-4
            text-sm
            text-gray-300
          "
        >
          Wybierz dwie wersje projektu. Zaznaczone:
          {" "}
          <strong>
            {
              firstVersion
                ? `Wersja ${firstVersion}`
                : "brak"
            }
          </strong>
          {" "}
          i
          {" "}
          <strong>
            {
              secondVersion
                ? `Wersja ${secondVersion}`
                : "brak"
            }
          </strong>.
        </div>

      )}

      <div
        className="
          mt-6
          grid
          gap-6
          md:grid-cols-2
          xl:grid-cols-3
        "
      >

        {versions.map(
          (
            version
          ) => {

            const isSelected =
              firstVersion ===
                version.versionNumber ||

              secondVersion ===
                version.versionNumber;

            return (

              <div

                key={
                  version.versionNumber
                }

                className={`
                  overflow-hidden
                  rounded-2xl
                  border
                  bg-black/30
                  transition
                  duration-300
                  ${
                    isSelected
                      ? "border-[#d8aa4c] ring-2 ring-[#d8aa4c]/20"
                      : "border-white/10 hover:border-[#d8aa4c]/35"
                  }
                `}
              >

                <button

                  type="button"

                  onClick={() => {

                    if (
                      compareMode
                    ) {

                      toggleVersionForCompare(
                        version.versionNumber
                      );

                      return;
                    }

                    setSelectedImage(
                      version.image
                    );
                  }}

                  className="
                    block
                    w-full
                    cursor-zoom-in
                  "
                >

                  <img
                    src={`data:image/png;base64,${version.image}`}
                    alt={`Wersja ${version.versionNumber}`}
                    className="
                      h-[260px]
                      w-full
                      object-cover
                      transition
                      duration-300
                      hover:scale-[1.02]
                    "
                  />

                </button>

                <div
                  className="
                    p-5
                  "
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
                          text-lg
                          font-black
                        "
                      >
                        Wersja {
                          version.versionNumber
                        }
                      </div>

                      <div
                        className="
                          mt-1
                          text-xs
                          uppercase
                          tracking-[0.16em]
                          text-gray-500
                        "
                      >
                        {
                          version.item.isCorrection
                            ? "Poprawka"
                            : version.versionNumber === 1
                              ? "Projekt początkowy"
                              : "Kolejna wersja"
                        }
                      </div>

                    </div>

                    <div
                      className="
                        rounded-full
                        border
                        border-white/10
                        bg-white/[0.04]
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        text-gray-400
                      "
                    >
                      Projektuj AI
                    </div>

                  </div>

                  <div
                    className="
                      mt-4
                      line-clamp-4
                      whitespace-pre-wrap
                      text-sm
                      leading-6
                      text-gray-300
                    "
                  >
                    {
                      version.item.user ||
                      "Wersja projektu bez dodatkowego opisu."
                    }
                  </div>

                  <div
                    className="
                      mt-5
                      grid
                      grid-cols-2
                      gap-3
                    "
                  >

                    <button

                      type="button"

                      onClick={() =>
                        setSelectedImage(
                          version.image
                        )
                      }

                      className="
                        rounded-xl
                        border
                        border-white/15
                        px-4
                        py-3
                        text-sm
                        font-bold
                        transition
                        hover:bg-white/[0.06]
                      "
                    >
                      Powiększ
                    </button>

                    <button

                      type="button"

                      onClick={() =>
                        downloadImage(
                          version.image,
                          version.versionNumber
                        )
                      }

                      className="
                        rounded-xl
                        bg-gradient-to-r
                        from-[#d8aa4c]
                        to-[#f4ca73]
                        px-4
                        py-3
                        text-sm
                        font-black
                        text-black
                        transition
                        hover:brightness-110
                      "
                    >
                      Pobierz
                    </button>

                  </div>

                </div>

              </div>

            );
          }
        )}

      </div>

      {
        compareMode &&
        firstComparedVersion &&
        secondComparedVersion && (

          <div
            className="
              mt-8
              rounded-[26px]
              border
              border-white/10
              bg-black/30
              p-4
              sm:p-6
            "
          >

            <div
              className="
                mb-5
                text-xl
                font-black
              "
            >
              Porównanie wersji {
                firstComparedVersion.versionNumber
              } i {
                secondComparedVersion.versionNumber
              }
            </div>

            <div
              className="
                grid
                gap-6
                lg:grid-cols-2
              "
            >

              {[
                firstComparedVersion,
                secondComparedVersion,
              ].map(
                (
                  version
                ) => (

                  <div
                    key={
                      version.versionNumber
                    }
                    className="
                      overflow-hidden
                      rounded-2xl
                      border
                      border-white/10
                      bg-[#0c1016]
                    "
                  >

                    <div
                      className="
                        border-b
                        border-white/10
                        px-4
                        py-3
                        font-bold
                      "
                    >
                      Wersja {
                        version.versionNumber
                      }
                    </div>

                    <img
                      src={`data:image/png;base64,${version.image}`}
                      alt={`Porównanie wersji ${version.versionNumber}`}
                      className="
                        max-h-[720px]
                        w-full
                        object-contain
                      "
                    />

                  </div>

                )
              )}

            </div>

          </div>

        )
      }

      {selectedImage && (

        <div
          className="
            fixed
            inset-0
            z-[120]
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

            onClick={(event) =>
              event.stopPropagation()
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
              alt="Powiększona wersja projektu"
              className="
                max-h-[88vh]
                max-w-full
                rounded-2xl
                object-contain
                shadow-2xl
              "
            />

          </div>

        </div>

      )}

    </div>
  );
}