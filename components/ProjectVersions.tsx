"use client";

export default function ProjectVersions({

  chat = [],

}: any) {

  if (!chat.length)
    return null;

  return (

    <div
      className="
        bg-white/5
        border
        border-white/10
        rounded-3xl
        p-6
        mb-10
      "
    >

      <div
        className="
          text-2xl
          font-bold
          mb-6
        "
      >
        Historia projektu
      </div>

      <div
        className="
          space-y-6
        "
      >

        {chat.map(
          (
            item: any,
            index: number
          ) => (

            <div

              key={index}

              className="
                bg-black/30
                rounded-3xl
                overflow-hidden
                border
                border-white/5
              "
            >

              {item.generatedImage && (

                <img
                  src={`data:image/png;base64,${item.generatedImage}`}
                  alt=""
                  className="
                    w-full
                    h-[260px]
                    object-cover
                  "
                />

              )}

              <div
                className="
                  p-6
                "
              >

                <div
                  className="
                    flex
                    justify-between
                    items-center
                    mb-4
                  "
                >

                  <div
                    className="
                      text-xl
                      font-bold
                    "
                  >
                    Wersja {index + 1}
                  </div>

                  <div
                    className="
                      text-sm
                      text-gray-400
                    "
                  >
                    DreamS AI
                  </div>

                </div>

                <div
                  className="
                    text-gray-300
                    whitespace-pre-wrap
                  "
                >
                  {item.user}
                </div>

              </div>

            </div>
          )
        )}

      </div>

    </div>
  );
}