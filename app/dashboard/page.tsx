"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import ProjectVersions
from "@/components/ProjectVersions";

export default function Home() {

  const [message, setMessage] =
    useState("");

  const [correctionMessage, setCorrectionMessage] =
    useState("");

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [finalizingIndex, setFinalizingIndex] =
    useState<number | null>(null);

  const [selectingIndex, setSelectingIndex] =
    useState<number | null>(null);

  const [chat, setChat] =
    useState<any[]>([]);

  const [projectMemory, setProjectMemory] =
    useState<any>(null);

  const [projectId, setProjectId] =
    useState<string | null>(null);

  const [projectStatus, setProjectStatus] =
    useState("Konsultacja");

  const [credits, setCredits] =
    useState<number>(0);

  const [plan, setPlan] =
    useState("FREE");

  const [loading, setLoading] =
    useState(false);

  const [savingProject, setSavingProject] =
    useState(false);

  const [images, setImages] =
    useState<string[]>([]);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [city, setCity] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [projectRating, setProjectRating] =
    useState<number>(0);

  const [showOrderPanel, setShowOrderPanel] =
    useState(false);

  const [orderMessage, setOrderMessage] =
    useState("");

  const [showProfilePanel, setShowProfilePanel] =
    useState(false);

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [company, setCompany] =
    useState("");

  const [nip, setNip] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [postalCode, setPostalCode] =
    useState("");

  const hasVisualization =
    chat.some(
      (item) =>
        item.generatedImages?.length > 0
    );

  useEffect(() => {

    async function loadProject() {

      try {

        const params =
          new URLSearchParams(
            window.location.search
          );

const currentProjectId =
  params.get("project");

const activeProjectId =
  currentProjectId;

if (
  !activeProjectId
) {

  localStorage.removeItem(
    "dreams_last_project"
  );

  setProjectId(
    null
  );

  return;
}

setProjectId(
  activeProjectId
);

const savedRating =
  localStorage.getItem(
    `project_rating_${activeProjectId}`
  );

if (savedRating) {

  setProjectRating(
    Number(savedRating)
  );
}

        const { data } =
          await supabase

            .from("projects")

            .select("*")

            .eq(
              "id",
              activeProjectId
            )

            .single();

        if (data) {

          const storedConversation =
            Array.isArray(
              data.conversation
            )
              ? data.conversation
              : [];

          const projectMeta =
            storedConversation.find(
              (
                item: any
              ) =>
                item?.__dreamsProjectMeta ===
                true
            ) ||
            null;

          const storedPreview =
            typeof data.image_url ===
              "string"
              ? data.image_url
              : "";

          const previewBase64 =
            storedPreview.startsWith(
              "data:image/"
            )
              ? (
                  storedPreview.split(
                    ","
                  )[1] ||
                  ""
                )
              : storedPreview;

          const visibleConversation =
            storedConversation
              .filter(
                (
                  item: any
                ) =>
                  item?.__dreamsProjectMeta !==
                  true
              )
              .map(
                (
                  item: any
                ) => {

                  if (
                    !previewBase64
                  ) {

                    return item;
                  }

                  if (
                    item?.__hasFinalizedImage
                  ) {

                    return {
                      ...item,

                      generatedImage:
                        previewBase64,

                      generatedImages: [
                        previewBase64,
                      ],

                      selectedVariant:
                        previewBase64,

                      finalized:
                        true,

                      finalizedImages: [
                        previewBase64,
                      ],
                    };
                  }

                  if (
                    item?.__hasSelectedImage
                  ) {

                    return {
                      ...item,

                      generatedImage:
                        previewBase64,

                      generatedImages: [
                        previewBase64,
                      ],

                      selectedVariant:
                        previewBase64,
                    };
                  }

                  if (
                    item?.__hasGeneratedImage
                  ) {

                    return {
                      ...item,

                      generatedImage:
                        previewBase64,

                      generatedImages: [
                        previewBase64,
                      ],
                    };
                  }

                  return item;
                }
              );

          setChat(
            visibleConversation
          );

          if (
            projectMeta?.memory
          ) {

            setProjectMemory(
              projectMeta.memory
            );
          }

          if (
            projectMeta?.status
          ) {

            setProjectStatus(
              projectMeta.status
            );
          }

          const savedContact =
            projectMeta?.contact ||
            {};

          if (
            savedContact.name
          ) {

            setName(
              savedContact.name
            );
          }

          if (
            savedContact.phone
          ) {

            setPhone(
              savedContact.phone
            );
          }

          if (
            savedContact.city
          ) {

            setCity(
              savedContact.city
            );
          }
        }

      } catch (err) {

        console.log(err);
      }
    }

    async function getUser() {

      try {

        const {
          data,
        } =
          await supabase.auth.getUser();

        if (
          data?.user?.email
        ) {

          setEmail(
            data.user.email
          );

          const metadata =
            data.user.user_metadata ||
            {};

          setName(
            String(
              metadata.name ||
              ""
            )
          );

          setPhone(
            String(
              metadata.phone ||
              ""
            )
          );

          setCity(
            String(
              metadata.city ||
              ""
            )
          );

          setCompany(
            String(
              metadata.company ||
              ""
            )
          );

          setNip(
            String(
              metadata.nip ||
              ""
            )
          );

          setAddress(
            String(
              metadata.address ||
              ""
            )
          );

          setPostalCode(
            String(
              metadata.postalCode ||
              ""
            )
          );
        }

      } catch (err) {

        console.log(err);
      }
    }

    async function loadProfile() {

      try {

        const {

          data: { user },

        } =
          await supabase.auth.getUser();

        if (!user?.email)
  return;

const { data } =
  await supabase

    .from("profiles")

    .select("*")

    .eq(
      "email",
      user.email
    )

    .maybeSingle();

       console.log("USER:", user);
console.log("PROFILE:", data);

if (data) {

  setCredits(
    data.credits || 0
  );

  setPlan(
    data.plan || "FREE"
  );
}
      } catch (err) {

        console.log(err);
      }
    }

    loadProject();
    getUser();
    loadProfile();

  }, []);

  function detectProjectStatus(
    aiReply: string
  ) {

    const lower =
      aiReply.toLowerCase();

    if (
      lower.includes(
        "wizualizacja"
      )
    ) {

      return "Projektowanie";
    }

    if (
      lower.includes(
        "popraw"
      )
    ) {

      return "Poprawki";
    }

    if (
      lower.includes(
        "gotowy"
      )
    ) {

      return "Gotowe";
    }

    return "Konsultacja";
  }

async function saveProject(
  updatedChat: any[],
  memory: any,
  previewImage?: string,
  status?: string
) {

  try {

    const {
      data: authData,
    } =
      await supabase.auth.getUser();

    const authenticatedEmail =
      authData?.user?.email ||
      email;

    if (
      !authenticatedEmail
    ) {

      throw new Error(
        "Brak zalogowanego użytkownika."
      );
    }

    /*
     * Tabela projects u użytkownika ma starszy schemat.
     * NIE używamy żadnych opcjonalnych kolumn takich jak:
     * memory, city, name, phone, updated_at.
     *
     * Pamięć projektu i dane kontaktowe zapisujemy
     * jako niewidoczny rekord wewnątrz istniejącej
     * kolumny conversation.
     */
    const projectMeta = {
      __dreamsProjectMeta:
        true,

      memory:
        compactProjectMemoryForApi(
          memory
        ) ||
        null,

      contact: {
        name:
          name || "",

        phone:
          phone || "",

        city:
          city || "",

        address:
          address || "",

        postalCode:
          postalCode || "",
      },

      status:
        status ||
        "Zapisany",

      savedAt:
        new Date()
          .toISOString(),
    };

    /*
     * NIE zapisujemy obrazów base64 wewnątrz conversation.
     * To właśnie powodowało timeout Postgresa przy UPDATE/INSERT.
     *
     * Zachowujemy tylko lekkie dane tekstowe/techniczne oraz
     * znaczniki mówiące, do którego wpisu należy podgląd.
     */
    const compactConversation =
      updatedChat.map(
        (
          item: any
        ) => {

          const {
            generatedImage:
              _generatedImage,

            generatedImages:
              _generatedImages,

            selectedVariant:
              _selectedVariant,

            finalizedImages:
              _finalizedImages,

            ...rest
          } =
            item || {};

          return {
            ...rest,

            __hasGeneratedImage:
              Boolean(
                _generatedImage ||
                (
                  Array.isArray(
                    _generatedImages
                  ) &&
                  _generatedImages.length >
                    0
                )
              ),

            __hasSelectedImage:
              Boolean(
                _selectedVariant
              ),

            __hasFinalizedImage:
              Boolean(
                Array.isArray(
                  _finalizedImages
                ) &&
                _finalizedImages.length >
                  0
              ),
          };
        }
      );

    const conversationToStore = [
      projectMeta,
      ...compactConversation,
    ];

    const compressedPreview =
      previewImage
        ? await compressImageForApi(
            previewImage,
            900,
            0.52
          )
        : undefined;


    const storedConversationSize =
      JSON.stringify(
        conversationToStore
      ).length;

    if (
      storedConversationSize >
      1_500_000
    ) {

      throw new Error(
        "Projekt zawiera zbyt dużo danych do zapisu. Usuń część bardzo długiej historii i spróbuj ponownie."
      );
    }

    if (
      projectId
    ) {

      const {
        error: updateError,
      } =
        await supabase

          .from(
            "projects"
          )

          .update({
            conversation:
              conversationToStore,

            image_url:
              compressedPreview,
          })

          .eq(
            "id",
            projectId
          );

      if (
        updateError
      ) {

        console.error(
          "UPDATE PROJECT ERROR:",
          updateError
        );

        throw new Error(
          updateError.message ||
          "Nie udało się zaktualizować projektu."
        );
      }

      localStorage.setItem(
        "dreams_last_project",
        projectId
      );

      return projectId;
    }

    const promptText =
      (
        message.trim() ||
        updatedChat
          .map(
            (
              item
            ) =>
              item?.user ||
              ""
          )
          .filter(
            Boolean
          )
          .join(
            " • "
          )
          .slice(
            0,
            1800
          ) ||
        "Projekt kuchni DreamS AI"
      );

    const {
      data,
      error,
    } =
      await supabase

        .from(
          "projects"
        )

        .insert([
          {
            user_email:
              authenticatedEmail,

            prompt:
              promptText,

            image_url:
              compressedPreview,

            conversation:
              conversationToStore,
          },
        ])

        .select(
          "id"
        )

        .single();

    if (
      error
    ) {

      console.error(
        "CREATE PROJECT ERROR:",
        error
      );

      throw new Error(
        error.message ||
        "Nie udało się zapisać projektu."
      );
    }

    if (
      !data?.id
    ) {

      throw new Error(
        "Projekt został zapisany bez identyfikatora."
      );
    }

    setProjectId(
      data.id
    );

    localStorage.setItem(
      "dreams_last_project",
      data.id
    );

    window.history.replaceState(
      {},
      "",
      `/dashboard?project=${data.id}`
    );

    return data.id;

  } catch (
    err
  ) {

    console.error(
      "SAVE PROJECT ERROR:",
      err
    );

    throw err;
  }
}

  function getCorrectionBaseImage() {

    for (
      let index =
        chat.length - 1;
      index >= 0;
      index -= 1
    ) {

      const item =
        chat[index];

      /*
       * Ostatnia poprawiona wersja ma pierwszeństwo.
       */
      if (
        item?.isCorrection &&
        item?.selectedVariant
      ) {

        return item.selectedVariant;
      }

      if (
        item?.isCorrection &&
        item?.generatedImage
      ) {

        return item.generatedImage;
      }

      /*
       * Następnie bierzemy wariant wybrany przez klienta.
       */
      if (
        item?.selectedVariant
      ) {

        return item.selectedVariant;
      }

      /*
       * Jeśli projekt został już zatwierdzony,
       * bazą jest jego główne zatwierdzone ujęcie.
       */
      if (
        Array.isArray(
          item?.finalizedImages
        ) &&
        item.finalizedImages.length >
          0
      ) {

        return item.finalizedImages[0];
      }

      if (
        item?.generatedImage
      ) {

        return item.generatedImage;
      }

      if (
        Array.isArray(
          item?.generatedImages
        ) &&
        item.generatedImages.length >
          0
      ) {

        return item.generatedImages[0];
      }
    }

    return null;
  }

  function compactProjectMemoryForApi(
    value: any
  ): any {

    if (
      value === null ||
      value === undefined
    ) {

      return value;
    }

    if (
      typeof value ===
      "string"
    ) {

      /*
       * Nigdy nie wysyłamy obrazów base64
       * ukrytych przypadkiem w pamięci projektu.
       */
      if (
        value.startsWith(
          "data:image/"
        ) ||
        value.length >
          200000
      ) {

        return "";
      }

      return value;
    }

    if (
      Array.isArray(
        value
      )
    ) {

      return value
        .slice(
          0,
          60
        )
        .map(
          compactProjectMemoryForApi
        );
    }

    if (
      typeof value ===
      "object"
    ) {

      const result:
        Record<
          string,
          any
        > = {};

      for (
        const [
          key,
          childValue,
        ] of Object.entries(
          value
        )
      ) {

        const lowerKey =
          key.toLowerCase();

        if (
          lowerKey.includes(
            "image"
          ) ||
          lowerKey.includes(
            "base64"
          )
        ) {

          continue;
        }

        result[key] =
          compactProjectMemoryForApi(
            childValue
          );
      }

      return result;
    }

    return value;
  }

  async function sendMessage(
  customMessage?: string,
  isCorrection = false
) {

    const outgoingMessage =
      (
        typeof customMessage === "string"
          ? customMessage
          : message
      ).trim();


    if (
      !outgoingMessage
    ) return;

    if (
      isCorrection &&
      !getCorrectionBaseImage()
    ) {

      alert(
        "Nie znaleziono wizualizacji bazowej do poprawki. Wybierz najpierw projekt lub wygeneruj wizualizację."
      );

      return;
    }

    setLoading(true);

    try {

      const slimHistory =
        chat
          .slice(-3)
          .map((item) => ({

            user:
              item.user,

            ai:
              item.ai,
          }));

      const correctionBaseImage =
        isCorrection
          ? getCorrectionBaseImage()
          : null;

      const compressedCorrectionImage =
        correctionBaseImage
          ? await compressImageForApi(
              correctionBaseImage,
              960,
              0.58
            )
          : null;

      /*
       * Przy poprawce wysyłamy TYLKO:
       * - tekst poprawki
       * - skompresowany obraz wybranego projektu
       * - lekką pamięć projektu
       *
       * Nie wysyłamy ponownie zdjęć pomieszczenia ani
       * wszystkich wcześniejszych wizualizacji.
       */
      const requestPayload = {

        message:
          outgoingMessage,

        history:
          slimHistory,

        projectMemory:
          isCorrection
            ? {
                /*
                 * Przy poprawce obraz jest źródłem prawdy.
                 * Nie wysyłamy całej starej pamięci materiałów,
                 * która mogłaby być sprzeczna z wybranym wariantem.
                 */
                version_number:
                  projectMemory?.version_number ||
                  1,

                change_history:
                  projectMemory?.change_history ||
                  [],

                protected_elements:
                  projectMemory?.protected_elements ||
                  null,
              }
            : compactProjectMemoryForApi(
                projectMemory
              ),

        images:
          isCorrection
            ? []
            : images,

        previousImages:
          isCorrection
            ? (
                compressedCorrectionImage
                  ? [
                      compressedCorrectionImage,
                    ]
                  : []
              )
            : [],

        isCorrection,

        correctionRequest:
          isCorrection
            ? outgoingMessage
            : null,

        name,
        phone,
        city,
        email,
      };

      const serializedPayload =
        JSON.stringify(
          requestPayload
        );

      /*
       * Vercel Functions mają limit wielkości żądania.
       * Ten bezpiecznik zapobiega wysłaniu zbyt dużego
       * requestu i daje normalny komunikat zamiast 413.
       */
      if (
        serializedPayload.length >
        3_200_000
      ) {

        throw new Error(
          "Obraz poprawki jest nadal zbyt duży. Odśwież projekt i spróbuj ponownie."
        );
      }

      const { data: sessionData } =
        await supabase.auth.getSession();

      const accessToken =
        sessionData.session?.access_token;

      const res =
        await fetch(
          "/api/chat",

          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },

            body:
              serializedPayload,
          }
        );

      const rawResponse =
        await res.text();

      let data:
        any = null;

      try {

        data =
          rawResponse
            ? JSON.parse(
                rawResponse
              )
            : null;

      } catch {

        throw new Error(
          rawResponse ||
          "Serwer zwrócił nieprawidłową odpowiedź."
        );
      }

      if (
        !res.ok
      ) {

        throw new Error(
          data?.error ||
          `Błąd serwera (${res.status}).`
        );
      }

      if (
        data?.success === false
      ) {

        console.log(data);

        alert(
          data?.error ||
          "Błąd AI"
        );

        setLoading(false);

        return;
      }

      const detectedStatus =
        isCorrection
          ? "Poprawki"
          : detectProjectStatus(
              data.reply
            );

      setProjectStatus(
        detectedStatus
      );

      const newItem = {

        user:
          outgoingMessage,

        isCorrection,

        ai:
          data.reply,

        generatedImage:
          data.generatedImage,

        generatedImages:
          data.generatedImages || [],

        floorPlan:
          data.floorPlan || null,

        furniturePlan:
          data.furniturePlan || null,

        design:
          data.design || null,

        estimate:
          data.estimate || null,

        selectedVariant:
          isCorrection
            ? (
                data.generatedImage ||
                data.generatedImages?.[0] ||
                null
              )
            : null,
      };

      const updatedChat = isCorrection
        ? [
            ...chat.map(
              (
                item
              ) => ({
                ...item,

                selectedVariant:
                  null,

                finalized:
                  false,

                finalizedImages:
                  [],
              })
            ),

            newItem,
          ]
        : [
            ...chat,
            newItem,
          ];

      setChat(
        updatedChat
      );

      if (
        data.memory
      ) {

        setProjectMemory(
          data.memory
        );
      }

      const generatedVisualization =
        Boolean(
          data.generatedImage ||
          (
            Array.isArray(
              data.generatedImages
            ) &&
            data.generatedImages.length > 0
          )
        );

      if (typeof data.credits === "number") {
        setCredits(data.credits);
      }
try {

        await saveProject(

          updatedChat,

          data.memory,

          data.generatedImage,

          detectedStatus
        );

      } catch (saveError) {

        console.log(
          "SAVE PROJECT ERROR:",
          saveError
        );
      }

      setMessage("");
      setCorrectionMessage("");
      setImages([]);

    } catch (err) {

      console.error(
        "SEND MESSAGE ERROR:",
        err
      );

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Nie udało się wprowadzić poprawki.";

      alert(
        errorMessage
      );

    } finally {

      setLoading(false);
    }
  }

  function applyQuickCorrection(
    correction: string
  ) {

    setCorrectionMessage(
      correction
    );
  }

  function rateProject(
    rating: number
  ) {

    setProjectRating(
      rating
    );

    if (
      projectId
    ) {

      localStorage.setItem(
        `project_rating_${projectId}`,
        String(rating)
      );
    }
  }

  function getLatestGeneratedImage() {

    const allImages =
      chat.flatMap(
        (item) =>
          item.generatedImages || []
      );

    return (
      allImages.at(-1) ||
      null
    );
  }

  function orderProject() {

    const latestImage =
      getLatestGeneratedImage();

    if (
      !latestImage
    ) {

      alert(
        "Najpierw wygeneruj wizualizację projektu."
      );

      return;
    }

    setShowOrderPanel(
      true
    );
  }

  function sendOrderRequest() {

    const subject =
      encodeURIComponent(
        `Zapytanie o realizację projektu ${projectId || ""}`
      );

    const body =
      encodeURIComponent(
        [
          "Dzień dobry,",
          "",
          "Chcę zamówić realizację projektu przygotowanego w Projektuj AI.",
          "",
          `ID projektu: ${projectId || "brak"}`,
          `Imię: ${name || "nie podano"}`,
          `Telefon: ${phone || "nie podano"}`,
          `Miejscowość: ${city || "nie podano"}`,
          `E-mail: ${email || "nie podano"}`,
          "",
          "Dodatkowe uwagi:",
          orderMessage || "brak",
        ].join("\\n")
      );

    window.location.href =
      `mailto:kontakt@dreamsai.pl?subject=${subject}&body=${body}`;

    setShowOrderPanel(
      false
    );
  }

  function downloadImage(
    base64Image: string,
    fileName = "Projektuj-AI-wizualizacja.png"
  ) {

    try {

      const link =
        document.createElement(
          "a"
        );

      link.href =
        `data:image/png;base64,${base64Image}`;

      link.download =
        fileName;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

    } catch (err) {

      console.log(
        "DOWNLOAD ERROR:",
        err
      );

      alert(
        "Nie udało się pobrać zdjęcia."
      );
    }
  }

  function getLatestTechnicalData() {

    for (
      let index = chat.length - 1;
      index >= 0;
      index -= 1
    ) {

      const item =
        chat[index];

      if (
        item?.furniturePlan ||
        item?.design ||
        item?.estimate
      ) {

        return {
          furniturePlan:
            item.furniturePlan ||
            null,

          design:
            item.design ||
            null,

          estimate:
            item.estimate ||
            null,
        };
      }
    }

    return {
      furniturePlan:
        null,

      design:
        null,

      estimate:
        null,
    };
  }

  const latestTechnicalData =
    getLatestTechnicalData();

  function getLatestProjectImages() {

    for (
      let index =
        chat.length - 1;
      index >= 0;
      index -= 1
    ) {

      const item =
        chat[index];

      if (
        Array.isArray(
          item?.finalizedImages
        ) &&
        item.finalizedImages.length > 0
      ) {

        return item.finalizedImages;
      }

      if (
        Array.isArray(
          item?.generatedImages
        ) &&
        item.generatedImages.length > 0
      ) {

        return item.generatedImages;
      }

      if (
        item?.generatedImage
      ) {

        return [
          item.generatedImage,
        ];
      }
    }

    return [];
  }

  async function compressImageForApi(
    image: string,
    maxSide = 1280,
    quality = 0.72
  ): Promise<string> {

    const source =
      image.startsWith(
        "data:image/"
      )
        ? image
        : `data:image/png;base64,${image}`;

    return await new Promise(
      (
        resolve,
        reject
      ) => {

        const img =
          new window.Image();

        img.onload =
          () => {

            try {

              const scale =
                Math.min(
                  1,
                  maxSide /
                    Math.max(
                      img.width,
                      img.height
                    )
                );

              const width =
                Math.max(
                  1,
                  Math.round(
                    img.width *
                    scale
                  )
                );

              const height =
                Math.max(
                  1,
                  Math.round(
                    img.height *
                    scale
                  )
                );

              const canvas =
                document.createElement(
                  "canvas"
                );

              canvas.width =
                width;

              canvas.height =
                height;

              const ctx =
                canvas.getContext(
                  "2d"
                );

              if (!ctx) {

                reject(
                  new Error(
                    "Nie udało się przygotować obrazu."
                  )
                );

                return;
              }

              ctx.drawImage(
                img,
                0,
                0,
                width,
                height
              );

              const compressed =
                canvas.toDataURL(
                  "image/jpeg",
                  quality
                );

              resolve(
                compressed
              );

            } catch (
              error
            ) {

              reject(
                error
              );
            }
          };

        img.onerror =
          () => {

            reject(
              new Error(
                "Nie udało się odczytać wybranego obrazu."
              )
            );
          };

        img.src =
          source;
      }
    );
  }

  async function chooseProjectVariant(
    chatIndex: number,
    image: string
  ) {

    try {

      setSelectingIndex(
        chatIndex
      );

      const item =
        chat[chatIndex];

      if (!item) {

        throw new Error(
          "Nie znaleziono wybranego wariantu."
        );
      }

      const compressedImage =
        await compressImageForApi(
          image
        );

      /*
       * Analizujemy DOKŁADNIE wybrane zdjęcie.
       * Dopiero wynik tej analizy pokazujemy jako
       * specyfikację i kolejność brył.
       */
      const response =
        await fetch(
          "/api/finalize-project",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                mode:
                  "analyze",

                selectedImage:
                  compressedImage,

                design:
                  item.design ||
                  latestTechnicalData.design ||
                  null,

                estimate:
                  item.estimate ||
                  latestTechnicalData.estimate ||
                  null,
              }),
          }
        );

      const rawText =
        await response.text();

      let data:
        any = null;

      try {

        data =
          rawText
            ? JSON.parse(
                rawText
              )
            : null;

      } catch {

        throw new Error(
          rawText ||
          "Nieprawidłowa odpowiedź serwera."
        );
      }

      if (
        !response.ok ||
        data?.success ===
          false
      ) {

        throw new Error(
          data?.error ||
          "Nie udało się przeanalizować wybranego projektu."
        );
      }

      const updatedChat =
        chat.map(
          (
            chatItem,
            index
          ) => {

            if (
              index !==
              chatIndex
            ) {

              return {
                ...chatItem,

                selectedVariant:
                  null,

                selectedSpecification:
                  null,

                selectedModules:
                  [],

                finalized:
                  false,

                finalizedImages:
                  [],
              };
            }

            return {
              ...chatItem,

              selectedVariant:
                image,

              selectedSpecification:
                data?.specification ||
                null,

              selectedModules:
                Array.isArray(
                  data?.modules
                )
                  ? data.modules
                  : [],

              selectedSummary:
                data?.summary ||
                null,

              finalized:
                false,

              finalizedImages:
                [],

              finalSpecification:
                null,

              finalSummary:
                null,
            };
          }
        );

      setChat(
        updatedChat
      );

      setProjectStatus(
        "Poprawki"
      );

      await saveProject(
        updatedChat,
        projectMemory,
        image,
        "Poprawki"
      );

      alert(
        "Projekt został wybrany i zapisany. Poniżej masz opis oraz bryły tego konkretnego wariantu. Teraz możesz nanosić poprawki."
      );

    } catch (
      error
    ) {

      console.error(
        "SELECT PROJECT ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się wybrać projektu.";

      alert(
        message
      );

    } finally {

      setSelectingIndex(
        null
      );
    }
  }

  function getSelectedProjectForFinalization() {

    for (
      let index =
        chat.length - 1;
      index >= 0;
      index -= 1
    ) {

      const item =
        chat[index];

      /*
       * Poprawiona wersja ma pierwszeństwo.
       * sendMessage(..., true) zapisuje poprawiony
       * obraz jako selectedVariant nowego wpisu.
       */
      if (
        item?.selectedVariant
      ) {

        return {
          chatIndex:
            index,

          image:
            item.selectedVariant,

          item,
        };
      }
    }

    return null;
  }

  async function approveSelectedProject() {

    const selected =
      getSelectedProjectForFinalization();

    if (
      !selected
    ) {

      alert(
        "Najpierw wybierz jeden z projektów."
      );

      return;
    }

    try {

      setFinalizingIndex(
        selected.chatIndex
      );

      const compressedImage =
        await compressImageForApi(
          selected.image
        );

      const response =
        await fetch(
          "/api/finalize-project",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                selectedImage:
                  compressedImage,

                design:
                  selected.item?.design ||
                  latestTechnicalData.design ||
                  null,

                estimate:
                  selected.item?.estimate ||
                  latestTechnicalData.estimate ||
                  null,
              }),
          }
        );

      const rawText =
        await response.text();

      let data:
        any = null;

      try {

        data =
          rawText
            ? JSON.parse(
                rawText
              )
            : null;

      } catch {

        throw new Error(
          rawText ||
          "Nieprawidłowa odpowiedź serwera."
        );
      }

      if (
        !response.ok ||
        data?.success ===
          false
      ) {

        throw new Error(
          data?.error ||
          "Nie udało się przygotować dokumentacji projektu."
        );
      }

      const finalizedImages =
        Array.isArray(
          data?.finalizedImages
        )
          ? data.finalizedImages
          : [
              selected.image,
            ];

      /*
       * Finalizujemy TYLKO aktualnie wybraną /
       * ostatnio poprawioną wersję.
       */
      const updatedChat =
        chat.map(
          (
            chatItem,
            index
          ) => {

            if (
              index !==
              selected.chatIndex
            ) {

              return {
                ...chatItem,

                finalized:
                  false,

                finalizedImages:
                  [],
              };
            }

            return {
              ...chatItem,

              selectedVariant:
                selected.image,

              finalized:
                true,

              finalizedImages,

              finalSpecification:
                data?.specification ||
                null,

              finalSummary:
                data?.summary ||
                null,
            };
          }
        );

      setChat(
        updatedChat
      );

      setProjectStatus(
        "Gotowe"
      );

      await saveProject(
        updatedChat,
        projectMemory,
        finalizedImages[0] ||
          selected.image,
        "Gotowe"
      );

      alert(
        "Projekt zatwierdzony. Wygenerowaliśmy dodatkowe ujęcia wyłącznie na podstawie wybranej, poprawionej kuchni. PDF jest gotowy do pobrania."
      );

    } catch (
      error
    ) {

      console.error(
        "FINALIZE PROJECT ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się zatwierdzić projektu.";

      alert(
        message
      );

    } finally {

      setFinalizingIndex(
        null
      );
    }
  }

  async function generatePDF() {

    try {

      const design =
        latestTechnicalData.design;

      const estimate =
        latestTechnicalData.estimate;

      const latestFinalizedItem =
        [...chat]
          .reverse()
          .find(
            (
              item
            ) =>
              item?.finalized ===
                true &&
              Array.isArray(
                item?.finalizedImages
              ) &&
              item.finalizedImages.length >
                0
          );

      const finalSpecification =
        latestFinalizedItem
          ?.finalSpecification ||
        null;

      if (
        !latestFinalizedItem
      ) {

        alert(
          "Najpierw wybierz projekt, nanieś poprawki i kliknij „Zatwierdź projekt”. PDF generujemy dopiero z zatwierdzonej wersji."
        );

        return;
      }

      const projectImages =
        latestFinalizedItem.finalizedImages;

      /*
       * Rozpiska brył do PDF:
       * najpierw dokładna analiza wybranego wariantu,
       * a jeśli jej brak - moduły techniczne projektu.
       */
      const finalModules =
        Array.isArray(
          latestFinalizedItem
            ?.selectedModules
        ) &&
        latestFinalizedItem
          .selectedModules
          .length > 0
          ? latestFinalizedItem
              .selectedModules
          : Array.isArray(
              design?.modules
            )
            ? design.modules
            : [];

      if (
        projectImages.length ===
        0
      ) {

        alert(
          "Najpierw wygeneruj lub wybierz projekt kuchni."
        );

        return;
      }

      const materials =
        design?.materials ||
        {};

      const appliances =
        design?.appliances ||
        {};

      const safeText = (
        value: unknown,
        fallback =
          "do ustalenia"
      ) => {

        if (
          value === null ||
          value === undefined ||
          value === ""
        ) {
          return fallback;
        }

        if (
          Array.isArray(
            value
          )
        ) {
          return value.length > 0
            ? value.join(", ")
            : fallback;
        }

        return String(
          value
        );
      };

      const escapeHtml = (
        value: unknown
      ) =>
        String(
          value ?? ""
        )
          .replace(
            /&/g,
            "&amp;"
          )
          .replace(
            /</g,
            "&lt;"
          )
          .replace(
            />/g,
            "&gt;"
          )
          .replace(
            /"/g,
            "&quot;"
          )
          .replace(
            /'/g,
            "&#039;"
          );

      const normalizeImage =
        (
          image: string
        ) =>
          image.startsWith(
            "data:image/"
          )
            ? image
            : `data:image/png;base64,${image}`;

      const loadImage =
        (
          src: string
        ) =>
          new Promise<HTMLImageElement>(
            (
              resolve,
              reject
            ) => {

              const img =
                new window.Image();

              img.onload =
                () =>
                  resolve(
                    img
                  );

              img.onerror =
                () =>
                  reject(
                    new Error(
                      "Nie udało się załadować obrazu do PDF."
                    )
                  );

              img.src =
                src;
            }
          );

      const logoImage =
        await loadImage(
          "/dreams-meble-logo.png"
        );

      const logoCanvas =
        document.createElement(
          "canvas"
        );

      logoCanvas.width =
        logoImage.naturalWidth;

      logoCanvas.height =
        logoImage.naturalHeight;

      const logoContext =
        logoCanvas.getContext(
          "2d"
        );

      if (
        logoContext
      ) {

        logoContext.drawImage(
          logoImage,
          0,
          0
        );
      }

      const logoDataUrl =
        logoCanvas.toDataURL(
          "image/png"
        );

      const pdf =
        new jsPDF({
          orientation:
            "landscape",

          unit:
            "mm",

          format:
            "a4",
        });

      const pageWidth =
        pdf.internal.pageSize
          .getWidth();

      const pageHeight =
        pdf.internal.pageSize
          .getHeight();

      const margin =
        12;

      for (
        let index = 0;
        index <
        projectImages.length;
        index += 1
      ) {

        if (
          index > 0
        ) {

          pdf.addPage(
            "a4",
            "landscape"
          );
        }

        const source =
          normalizeImage(
            projectImages[
              index
            ]
          );

        const image =
          await loadImage(
            source
          );

        const maxWidth =
          pageWidth -
          margin * 2;

        const maxHeight =
          pageHeight -
          43;

        const ratio =
          Math.min(
            maxWidth /
              image.naturalWidth,
            maxHeight /
              image.naturalHeight
          );

        const drawWidth =
          image.naturalWidth *
          ratio;

        const drawHeight =
          image.naturalHeight *
          ratio;

        const x =
          (
            pageWidth -
            drawWidth
          ) / 2;

        const y =
          24 +
          (
            pageHeight -
            34 -
            drawHeight
          ) / 2;

        /*
         * Strona wizualizacji - premium czarno/złota oprawa.
         */
        pdf.setFillColor(
          8,
          11,
          16
        );
        pdf.rect(
          0,
          0,
          pageWidth,
          pageHeight,
          "F"
        );

        pdf.setFillColor(
          255,
          255,
          255
        );
        pdf.roundedRect(
          margin,
          5.5,
          58,
          13,
          2.5,
          2.5,
          "F"
        );

        pdf.addImage(
          logoDataUrl,
          "PNG",
          margin + 3,
          8,
          51,
          7.5,
          undefined,
          "FAST"
        );

        pdf.setFillColor(
          216,
          170,
          76
        );
        pdf.rect(
          0,
          21,
          pageWidth,
          1.1,
          "F"
        );

        pdf.setFontSize(
          8
        );
        pdf.setTextColor(
          216,
          170,
          76
        );
        pdf.text(
          "PROJEKT INDYWIDUALNY • DREAMS AI",
          pageWidth - margin,
          10,
          {
            align:
              "right",
          }
        );

        /*
         * Wbudowane fonty jsPDF nie obsługują poprawnie litery Ę.
         * Dlatego napis UJĘCIE renderujemy przez canvas i wstawiamy
         * do PDF jako obraz PNG. Dzięki temu polskie znaki są poprawne.
         */
        const shotLabelCanvas =
          document.createElement(
            "canvas"
          );

        shotLabelCanvas.width =
          900;

        shotLabelCanvas.height =
          90;

        const shotLabelContext =
          shotLabelCanvas.getContext(
            "2d"
          );

        if (
          shotLabelContext
        ) {

          shotLabelContext.clearRect(
            0,
            0,
            shotLabelCanvas.width,
            shotLabelCanvas.height
          );

          shotLabelContext.font =
            "700 38px Arial";

          shotLabelContext.fillStyle =
            "#ffffff";

          shotLabelContext.textAlign =
            "right";

          shotLabelContext.textBaseline =
            "middle";

          shotLabelContext.fillText(
            `UJĘCIE ${index + 1} / ${projectImages.length}`,
            shotLabelCanvas.width - 5,
            shotLabelCanvas.height / 2
          );

          pdf.addImage(
            shotLabelCanvas.toDataURL(
              "image/png"
            ),
            "PNG",
            pageWidth - margin - 58,
            11.5,
            58,
            7,
            undefined,
            "FAST"
          );
        }

        pdf.setDrawColor(
          216,
          170,
          76
        );
        pdf.setLineWidth(
          0.45
        );
        pdf.roundedRect(
          x - 1.6,
          y - 1.6,
          drawWidth + 3.2,
          drawHeight + 3.2,
          2,
          2,
          "S"
        );

        pdf.setFontSize(
          7.5
        );
        pdf.setTextColor(
          150,
          156,
          166
        );
        pdf.text(
          "Wizualizacja koncepcyjna • dreamsai.pl",
          pageWidth - margin,
          pageHeight - 5,
          {
            align:
              "right",
          }
        );

        pdf.setTextColor(
          216,
          170,
          76
        );
        pdf.text(
          "Wnętrza z Twoich marzeń",
          margin,
          pageHeight - 5
        );

        const format =
          source.includes(
            "image/jpeg"
          )
            ? "JPEG"
            : "PNG";

        pdf.addImage(
          source,
          format,
          x,
          y,
          drawWidth,
          drawHeight,
          undefined,
          "FAST"
        );
      }

      pdf.addPage(
        "a4",
        "landscape"
      );

      const summary =
        document.createElement(
          "div"
        );

      summary.style.position =
        "fixed";
      summary.style.left =
        "-20000px";
      summary.style.top =
        "0";
      summary.style.width =
        "1123px";
      summary.style.minHeight =
        "794px";
      summary.style.background =
        "#ffffff";
      summary.style.color =
        "#111827";
      summary.style.fontFamily =
        "Arial, sans-serif";
      summary.style.padding =
        "54px 62px";
      summary.style.boxSizing =
        "border-box";

      const row = (
        label: string,
        value: unknown
      ) => `
        <div style="
          display:grid;
          grid-template-columns:240px 1fr;
          gap:18px;
          padding:10px 0;
          border-bottom:1px solid #e5e7eb;
          font-size:17px;
        ">
          <div style="
            color:#6b7280;
            font-weight:700;
          ">
            ${label}
          </div>

          <div style="
            color:#111827;
            font-weight:700;
          ">
            ${safeText(
              value
            )}
          </div>
        </div>
      `;

      summary.innerHTML = `
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:34px;
          padding:20px 24px;
          margin-bottom:28px;
          border-radius:24px;
          background:linear-gradient(135deg,#0b0f16 0%,#161b24 100%);
          box-shadow:0 18px 50px rgba(0,0,0,.12);
          border-bottom:5px solid #d8aa4c;
        ">
          <div style="
            display:flex;
            align-items:center;
            gap:26px;
          ">
            <div style="
              width:245px;
              background:#fff;
              border-radius:16px;
              padding:10px 14px;
              box-sizing:border-box;
            ">
              <img
                src="${logoDataUrl}"
                style="
                  width:100%;
                  height:auto;
                  display:block;
                "
              />
            </div>

            <div>
              <div style="
                color:#d8aa4c;
                font-size:13px;
                font-weight:900;
                letter-spacing:3px;
                text-transform:uppercase;
              ">
                Projekt indywidualny
              </div>

              <div style="
                margin-top:7px;
                color:#ffffff;
                font-size:34px;
                line-height:1.05;
                font-weight:900;
              ">
                Karta projektu kuchni
              </div>

              <div style="
                margin-top:8px;
                color:#9ca3af;
                font-size:13px;
              ">
                DreamS AI • Wnętrza z Twoich marzeń
              </div>
            </div>
          </div>

          <div style="
            color:#d1d5db;
            font-size:14px;
            text-align:right;
            line-height:1.6;
          ">
            <div style="
              color:#d8aa4c;
              font-size:11px;
              font-weight:900;
              letter-spacing:2px;
              text-transform:uppercase;
            ">
              Data projektu
            </div>
            ${new Date()
              .toLocaleDateString(
                "pl-PL"
              )}
          </div>
        </div>

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:42px;
        ">
          <div>
            <div style="
              margin-bottom:12px;
              font-size:23px;
              font-weight:900;
            ">
              Materiały i wygląd
            </div>

            ${row(
              "Układ kuchni",
              design?.layout
            )}

            ${row(
              "Styl",
              finalSpecification?.style ||
              materials?.style
            )}

            ${row(
              "Kolor frontów",
              finalSpecification?.frontColor
            )}

            ${row(
              "RAL frontów",
              finalSpecification?.frontRal
            )}

            ${row(
              "Wykończenie",
              finalSpecification?.frontFinish
            )}

            ${row(
              "Materiał frontów",
              finalSpecification?.frontMaterial ||
              materials?.fronts
            )}

            ${row(
              "Płyta / dekor",
              finalSpecification?.board
            )}

            ${row(
              "Producent płyty",
              finalSpecification?.boardManufacturer
            )}

            ${row(
              "Kod / struktura",
              [
                finalSpecification?.boardCode,
                finalSpecification?.boardTexture,
              ].filter(Boolean).join(" • ")
            )}

            ${row(
              "Blat",
              finalSpecification?.countertop ||
              materials?.countertop
            )}

            ${row(
              "Blat — producent / kod",
              [
                finalSpecification?.countertopManufacturer,
                finalSpecification?.countertopCode,
              ].filter(Boolean).join(" • ")
            )}

            ${row(
              "Uchwyty / system",
              finalSpecification?.handles ||
              materials?.handles
            )}

            ${row(
              "Cokół",
              finalSpecification?.plinth
            )}

            ${row(
              "Ściana nad blatem",
              finalSpecification?.backsplash ||
              materials?.backsplash
            )}

            ${row(
              "Oświetlenie",
              finalSpecification?.lighting ||
              materials?.lighting
            )}
          </div>

          <div>
            <div style="
              margin-bottom:12px;
              font-size:23px;
              font-weight:900;
            ">
              AGD i wyposażenie
            </div>

            ${row(
              "Lodówka",
              appliances?.refrigerator
            )}

            ${row(
              "Piekarnik",
              appliances?.oven
            )}

            ${row(
              "Płyta grzewcza",
              appliances?.hob
            )}

            ${row(
              "Zmywarka",
              appliances?.dishwasher
            )}

            ${row(
              "Zlew",
              appliances?.sink
            )}

            ${row(
              "Wyspa",
              design?.island?.included
                ? "Tak"
                : "Nie"
            )}

            ${
              estimate
                ? `
                  <div style="
                    margin-top:28px;
                    padding:24px;
                    border-radius:18px;
                    background:linear-gradient(135deg,#fbf7ee 0%,#f3e4c4 100%);
                    border:1px solid #d8aa4c;
                    box-shadow:0 14px 34px rgba(153,105,20,.12);
                  ">
                    <div style="
                      color:#9a6a14;
                      font-size:14px;
                      font-weight:900;
                      letter-spacing:2px;
                      text-transform:uppercase;
                    ">
                      Szacunkowa wycena
                    </div>

                    <div style="
                      margin-top:8px;
                      font-size:34px;
                      font-weight:900;
                    ">
                      ${Number(
                        estimate.brutto ||
                        0
                      ).toLocaleString(
                        "pl-PL"
                      )} zł brutto
                    </div>

                    <div style="
                      margin-top:8px;
                      color:#6b7280;
                      font-size:14px;
                      line-height:1.5;
                    ">
                      Wycena orientacyjna.
                      AGD wyceniane osobno.
                      Cena końcowa wymaga pomiaru
                      i potwierdzenia materiałów.
                    </div>
                  </div>
                `
                : ""
            }
          </div>
        </div>

        <div style="
          margin-top:24px;
          padding:18px 22px;
          border-radius:16px;
          background:#111827;
          color:#f8fafc;
          border-left:5px solid #d8aa4c;
        ">
          <div style="
            color:#e7bd67;
            font-size:12px;
            font-weight:900;
            letter-spacing:2px;
            text-transform:uppercase;
          ">
            Potwierdzenie materiałów
          </div>
          <div style="
            margin-top:7px;
            font-size:13px;
            line-height:1.55;
            color:#d1d5db;
          ">
            ${safeText(
              finalSpecification?.colorMatchNote,
              "Kolory i dekory są rekomendacją projektową. Przed produkcją należy potwierdzić wybór na fizycznej próbce materiału / wzorniku RAL."
            )}
          </div>
        </div>

        <div style="
          margin-top:18px;
          padding-top:14px;
          border-top:1px solid #e5e7eb;
          color:#9ca3af;
          font-size:12px;
          display:flex;
          justify-content:space-between;
        ">
          <span>DreamS AI • Projekt kuchni</span>
          <span>dreamsai.pl</span>
        </div>
      `;

      document.body.appendChild(
        summary
      );

      const summaryCanvas =
        await html2canvas(
          summary,
          {
            scale:
              1.5,

            backgroundColor:
              "#ffffff",

            useCORS:
              true,
          }
        );

      document.body.removeChild(
        summary
      );

      const summaryImage =
        summaryCanvas.toDataURL(
          "image/jpeg",
          0.94
        );

      const summaryRatio =
        Math.min(
          (
            pageWidth -
            margin * 2
          ) /
            summaryCanvas.width,

          (
            pageHeight -
            margin * 2
          ) /
            summaryCanvas.height
        );

      const summaryWidth =
        summaryCanvas.width *
        summaryRatio;

      const summaryHeight =
        summaryCanvas.height *
        summaryRatio;

      pdf.addImage(
        summaryImage,
        "JPEG",
        (
          pageWidth -
          summaryWidth
        ) / 2,
        (
          pageHeight -
          summaryHeight
        ) / 2,
        summaryWidth,
        summaryHeight,
        undefined,
        "FAST"
      );

      /*
       * DODATKOWA STRONA:
       * wszystkie bryły / szafki po kolei.
       */
      pdf.addPage(
        "a4",
        "landscape"
      );

      const modulesPage =
        document.createElement(
          "div"
        );

      modulesPage.style.position =
        "fixed";
      modulesPage.style.left =
        "-20000px";
      modulesPage.style.top =
        "0";
      modulesPage.style.width =
        "1123px";
      modulesPage.style.height =
        "794px";
      modulesPage.style.background =
        "#f7f8fa";
      modulesPage.style.color =
        "#111827";
      modulesPage.style.fontFamily =
        "Arial, sans-serif";
      modulesPage.style.padding =
        "38px 46px";
      modulesPage.style.boxSizing =
        "border-box";
      modulesPage.style.overflow =
        "hidden";

      const moduleCards =
        finalModules.length > 0
          ? finalModules
              .map(
                (
                  module: any,
                  index: number
                ) => {

                  const order =
                    module?.order ||
                    index + 1;

                  const dimensions =
                    [
                      module?.width_mm
                        ? `szer. ${module.width_mm} mm`
                        : null,
                      module?.height_mm
                        ? `wys. ${module.height_mm} mm`
                        : null,
                      module?.depth_mm
                        ? `gł. ${module.depth_mm} mm`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" • ");

                  const description =
                    module?.description ||
                    module?.function ||
                    module?.notes ||
                    "Bryła meblowa zgodna z wybranym wariantem.";

                  const confidence =
                    module?.confidence
                      ? `Pewność analizy: ${module.confidence}`
                      : "";

                  return `
                    <div style="
                      display:grid;
                      grid-template-columns:54px 1fr;
                      gap:14px;
                      padding:13px 15px;
                      border-radius:16px;
                      background:#ffffff;
                      border:1px solid #e5e7eb;
                      box-shadow:0 7px 20px rgba(17,24,39,.055);
                      min-height:80px;
                      box-sizing:border-box;
                    ">
                      <div style="
                        width:44px;
                        height:44px;
                        border-radius:13px;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:#0c1016;
                        color:#d8aa4c;
                        font-size:20px;
                        font-weight:900;
                      ">
                        ${escapeHtml(order)}
                      </div>

                      <div>
                        <div style="
                          display:flex;
                          justify-content:space-between;
                          gap:14px;
                          align-items:flex-start;
                        ">
                          <div style="
                            font-size:16px;
                            line-height:1.25;
                            font-weight:900;
                            color:#111827;
                          ">
                            ${escapeHtml(
                              module?.name ||
                              `Szafka ${order}`
                            )}
                          </div>

                          ${
                            module?.wall
                              ? `
                                <div style="
                                  flex:0 0 auto;
                                  padding:4px 8px;
                                  border-radius:999px;
                                  background:#f4e6c7;
                                  color:#8c631a;
                                  font-size:10px;
                                  font-weight:900;
                                ">
                                  ŚCIANA ${escapeHtml(
                                    module.wall
                                  )}
                                </div>
                              `
                              : ""
                          }
                        </div>

                        ${
                          dimensions
                            ? `
                              <div style="
                                margin-top:5px;
                                color:#a06f19;
                                font-size:11px;
                                font-weight:800;
                              ">
                                ${escapeHtml(
                                  dimensions
                                )}
                              </div>
                            `
                            : ""
                        }

                        <div style="
                          margin-top:5px;
                          color:#4b5563;
                          font-size:11px;
                          line-height:1.38;
                        ">
                          ${escapeHtml(
                            description
                          )}
                        </div>

                        ${
                          confidence
                            ? `
                              <div style="
                                margin-top:4px;
                                color:#9ca3af;
                                font-size:9px;
                              ">
                                ${escapeHtml(
                                  confidence
                                )}
                              </div>
                            `
                            : ""
                        }
                      </div>
                    </div>
                  `;
                }
              )
              .join("")
          : `
              <div style="
                padding:36px;
                border-radius:18px;
                background:#fff;
                border:1px solid #e5e7eb;
                color:#6b7280;
                text-align:center;
              ">
                Brak dokładnej rozpiski brył dla tego wariantu.
              </div>
            `;

      modulesPage.innerHTML = `
        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:30px;
          padding-bottom:18px;
          margin-bottom:18px;
          border-bottom:3px solid #d8aa4c;
        ">
          <div style="
            display:flex;
            align-items:center;
            gap:24px;
          ">
            <div style="
              width:220px;
              background:#fff;
              padding:8px 12px;
              border-radius:14px;
              box-shadow:0 8px 26px rgba(0,0,0,.07);
            ">
              <img
                src="${logoDataUrl}"
                style="
                  width:100%;
                  display:block;
                "
              />
            </div>

            <div>
              <div style="
                color:#b07a1e;
                font-size:12px;
                font-weight:900;
                letter-spacing:3px;
                text-transform:uppercase;
              ">
                Dokumentacja projektu
              </div>

              <div style="
                margin-top:5px;
                font-size:31px;
                line-height:1;
                font-weight:900;
                color:#111827;
              ">
                Rozpiska szafek i brył
              </div>
            </div>
          </div>

          <div style="
            text-align:right;
            color:#6b7280;
            font-size:12px;
            line-height:1.45;
          ">
            <strong style="
              color:#111827;
              font-size:15px;
            ">
              ${finalModules.length}
            </strong>
            <br/>
            elementów w projekcie
          </div>
        </div>

        <div style="
          margin-bottom:14px;
          padding:10px 13px;
          border-radius:12px;
          background:#111827;
          color:#d1d5db;
          font-size:10.5px;
          line-height:1.4;
        ">
          Elementy opisano po kolei zgodnie z analizą wybranego wariantu.
          Kolejność zaczyna się od lewej strony widocznego ciągu i prowadzi
          logicznie przez kolejne ściany. Dokument jest materiałem koncepcyjnym -
          wymiary produkcyjne należy potwierdzić po pomiarze.
        </div>

        <div style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px 12px;
          align-content:start;
        ">
          ${moduleCards}
        </div>

        <div style="
          position:absolute;
          left:46px;
          right:46px;
          bottom:18px;
          display:flex;
          justify-content:space-between;
          padding-top:8px;
          border-top:1px solid #d1d5db;
          color:#9ca3af;
          font-size:9px;
        ">
          <span>DreamS AI • Rozpiska brył</span>
          <span>dreamsai.pl • Wnętrza z Twoich marzeń</span>
        </div>
      `;

      document.body.appendChild(
        modulesPage
      );

      const modulesCanvas =
        await html2canvas(
          modulesPage,
          {
            scale:
              1.5,

            backgroundColor:
              "#f7f8fa",

            useCORS:
              true,
          }
        );

      document.body.removeChild(
        modulesPage
      );

      const modulesImage =
        modulesCanvas.toDataURL(
          "image/jpeg",
          0.95
        );

      const modulesRatio =
        Math.min(
          (
            pageWidth -
            margin * 2
          ) /
            modulesCanvas.width,

          (
            pageHeight -
            margin * 2
          ) /
            modulesCanvas.height
        );

      const modulesWidth =
        modulesCanvas.width *
        modulesRatio;

      const modulesHeight =
        modulesCanvas.height *
        modulesRatio;

      pdf.addImage(
        modulesImage,
        "JPEG",
        (
          pageWidth -
          modulesWidth
        ) / 2,
        (
          pageHeight -
          modulesHeight
        ) / 2,
        modulesWidth,
        modulesHeight,
        undefined,
        "FAST"
      );

      pdf.save(
        `DreamS-AI-projekt-kuchni-${
          new Date()
            .toISOString()
            .slice(
              0,
              10
            )
        }.pdf`
      );

    } catch (
      err
    ) {

      console.error(
        "PDF ERROR:",
        err
      );

      alert(
        "Nie udało się wygenerować PDF."
      );
    }
  }


  useEffect(() => {

    const elements =
      Array.from(
        document.querySelectorAll(
          "body > header, body > nav"
        )
      ) as HTMLElement[];

    elements.forEach((element) => {
      element.dataset.dreamsPreviousDisplay =
        element.style.display || "";

      element.style.display =
        "none";
    });

    return () => {

      elements.forEach((element) => {
        element.style.display =
          element.dataset.dreamsPreviousDisplay || "";
      });
    };

  }, []);

  async function saveProfileData() {

    try {

      setProfileSaving(
        true
      );

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {

        alert(
          "Sesja wygasła. Zaloguj się ponownie."
        );

        window.location.href =
          "/login";

        return;
      }

      const {
        error,
      } =
        await supabase.auth.updateUser({
          data: {
            name:
              name.trim(),

            phone:
              phone.trim(),

            city:
              city.trim(),

            company:
              company.trim(),

            nip:
              nip.trim(),

            address:
              address.trim(),

            postalCode:
              postalCode.trim(),
          },
        });

      if (error) {

        console.error(
          "PROFILE UPDATE ERROR:",
          error
        );

        alert(
          error.message ||
          "Nie udało się zapisać danych."
        );

        return;
      }

      /*
       * Dane kontaktowe zapisujemy w auth metadata.
       * NIE zapisujemy name / phone / city jako osobnych
       * kolumn w tabeli projects, ponieważ tabela ich nie ma.
       *
       * Przy kolejnym zapisie projektu dane zostaną
       * dołączone do pola memory.contact.
       */

      alert(
        "Dane zostały zapisane."
      );

      setShowProfilePanel(
        false
      );

    } catch (error) {

      console.error(
        "SAVE PROFILE ERROR:",
        error
      );

      alert(
        "Nie udało się zapisać danych."
      );

    } finally {

      setProfileSaving(
        false
      );
    }
  }

  async function saveCurrentProject() {

    if (
      chat.length === 0
    ) {

      alert(
        "Najpierw rozpocznij projekt."
      );

      return;
    }

    try {

      setSavingProject(
        true
      );

      const lastPreviewItem =
        [...chat]
          .reverse()
          .find(
            (
              item
            ) =>
              item?.selectedVariant ||
              item?.finalizedImages?.[0] ||
              item?.generatedImage ||
              item?.generatedImages?.[0]
          );

      const previewImage =
        lastPreviewItem?.selectedVariant ||
        lastPreviewItem?.finalizedImages?.[0] ||
        lastPreviewItem?.generatedImage ||
        lastPreviewItem?.generatedImages?.[0] ||
        undefined;

      const savedId =
        await saveProject(
          chat,
          projectMemory,
          previewImage,
          "Zapisany"
        );

      setProjectStatus(
        "Zapisany"
      );

      if (
        savedId
      ) {

        localStorage.setItem(
          "dreams_last_project",
          savedId
        );
      }

      const goToHistory =
        window.confirm(
          "Projekt został zapisany na później. Chcesz teraz przejść do Historii projektów?"
        );

      if (
        goToHistory
      ) {

        window.location.href =
          "/projects";
      }

    } catch (
      error
    ) {

      console.error(
        "MANUAL SAVE PROJECT ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się zapisać projektu.";

      alert(
        message
      );

    } finally {

      setSavingProject(
        false
      );
    }
  }

  async function createNewProject() {

    localStorage.removeItem(
      "dreams_last_project"
    );

    setProjectId(
      null
    );

    setChat(
      []
    );

    setProjectMemory(
      null
    );

    setProjectStatus(
      "Konsultacja"
    );

    setMessage(
      ""
    );

    setCorrectionMessage(
      ""
    );

    setImages(
      []
    );

    window.history.replaceState(
      {},
      "",
      "/dashboard"
    );
  }

  async function deleteCurrentProject() {

    if (
      !projectId
    ) {

      createNewProject();

      return;
    }

    const accepted =
      window.confirm(
        "Czy na pewno chcesz usunąć ten projekt?"
      );

    if (
      !accepted
    ) return;

    const { error } =
      await supabase

        .from("projects")

        .delete()

        .eq(
          "id",
          projectId
        );

    if (
      error
    ) {

      console.log(
        "DELETE PROJECT ERROR:",
        error
      );

      alert(
        "Nie udało się usunąć projektu."
      );

      return;
    }

    createNewProject();
  }

  return (

    <main
      className="
        min-h-screen
        bg-[#07090d]
        text-white
      "
    >

      <div
        className="
          min-h-screen
          lg:grid
          lg:grid-cols-[320px_1fr]
        "
      >

        {/* LEWY PANEL */}

        <aside
          className="
            hidden
            lg:flex
            lg:fixed
            lg:inset-y-0
            lg:left-0
            lg:w-[320px]
            lg:flex-col
            border-r
            border-white/10
            bg-[#090c11]
            px-5
            py-6
            z-40
          "
        >

          <div
            className="
              px-3
              pb-7
              border-b
              border-white/10
            "
          >

            <Image
              src="/logo.png"
              alt="Projektuj AI"
              width={240}
              height={85}
              priority
              className="
                h-auto
                w-[235px]
                object-contain
              "
            />

          </div>

          <nav
            className="
              mt-7
              space-y-2
            "
          >

            <button
              type="button"
              className="
                flex
                w-full
                items-center
                gap-4
                rounded-2xl
                border
                border-[#d8aa4c]/20
                bg-gradient-to-r
                from-[#d8aa4c]/15
                to-white/5
                px-5
                py-4
                text-left
                font-semibold
                text-[#f0c56e]
              "
            >
              <span className="text-xl">⌂</span>
              Mój projekt
            </button>

            <button
              type="button"
              onClick={() =>
                window.location.href =
                  "/projects"
              }
              className="
                flex
                w-full
                items-center
                gap-4
                rounded-2xl
                px-5
                py-4
                text-left
                text-gray-200
                transition
                hover:bg-white/5
              "
            >
              <span className="text-xl">↶</span>
              Historia projektów
            </button>

            <button
              type="button"
              onClick={() =>
                setShowProfilePanel(
                  true
                )
              }
              className="
                flex
                w-full
                items-center
                gap-4
                rounded-2xl
                px-5
                py-4
                text-left
                text-gray-200
                transition
                hover:bg-white/5
              "
            >
              <span className="text-xl">♙</span>
              Moje dane
            </button>

            <button
              type="button"
              onClick={() =>
                window.location.href =
                  "/pricing"
              }
              className="
                flex
                w-full
                items-center
                gap-4
                rounded-2xl
                px-5
                py-4
                text-left
                text-gray-200
                transition
                hover:bg-white/5
              "
            >
              <span className="text-xl">▭</span>
              Pakiety i płatności
            </button>

          </nav>

          <div
            className="
              mt-6
              border-t
              border-white/10
              pt-6
            "
          >

            <div
              className="
                rounded-3xl
                border
                border-[#d8aa4c]/25
                bg-gradient-to-br
                from-[#d8aa4c]/10
                to-transparent
                p-5
              "
            >

              <div
                className="
                  text-lg
                  font-bold
                  text-[#f0c56e]
                "
              >
                Masz pomysł na wnętrze?
              </div>

              <p
                className="
                  mt-3
                  leading-7
                  text-gray-400
                "
              >
                Stwórz wizualizację, wprowadź poprawki i przygotuj projekt do realizacji.
              </p>

              <button
                type="button"
                onClick={() =>
                  window.location.href =
                    "/pricing"
                }
                className="
                  mt-5
                  w-full
                  rounded-2xl
                  bg-gradient-to-r
                  from-[#d8aa4c]
                  to-[#f4ca73]
                  px-5
                  py-3.5
                  font-bold
                  text-black
                  transition
                  hover:brightness-110
                "
              >
                Zobacz pakiety
              </button>

            </div>

          </div>

          <div
            className="
              mt-auto
              rounded-3xl
              border
              border-white/10
              bg-white/[0.03]
              p-5
            "
          >

            <div className="font-bold">
              Potrzebujesz pomocy?
            </div>

            <div
              className="
                mt-2
                text-sm
                text-gray-400
              "
            >
              Skontaktuj się z nami
            </div>

            <div
              className="
                mt-3
                text-[#f0c56e]
              "
            >
              kontakt@dreamsai.pl
            </div>

          </div>

        </aside>

        {/* GŁÓWNA CZĘŚĆ */}

        <section
          className="
            min-w-0
            lg:col-start-2
          "
        >

          {/* GÓRNY PASEK */}

          <div
            className="
              sticky
              top-0
              z-30
              border-b
              border-white/10
              bg-[#07090d]/95
              backdrop-blur-xl
            "
          >

            <div
              className="
                mx-auto
                flex
                max-w-[1500px]
                items-center
                justify-between
                gap-4
                px-4
                py-4
                sm:px-6
                lg:px-8
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                  lg:hidden
                "
              >

                <Image
                  src="/logo.png"
                  alt="Projektuj AI"
                  width={155}
                  height={55}
                  className="
                    h-auto
                    w-[155px]
                  "
                />

              </div>

              <div
                className="
                  ml-auto
                  flex
                  items-center
                  gap-2
                  sm:gap-3
                "
              >

                <div
                  className="
                    hidden
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    sm:block
                  "
                >
                  Kredyty: {credits}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    window.location.href =
                      "/pricing"
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
                    sm:px-5
                  "
                >
                  Pakiety
                </button>

                <div
                  className="
                    hidden
                    max-w-[250px]
                    truncate
                    rounded-xl
                    border
                    border-white/10
                    bg-white/5
                    px-4
                    py-3
                    text-sm
                    text-gray-300
                    md:block
                  "
                >
                  {email || "Moje konto"}
                </div>

                <button
                  type="button"
                  onClick={async () => {

                    await supabase.auth.signOut();

                    window.location.href =
                      "/";
                  }}
                  className="
                    rounded-xl
                    border
                    border-[#d8aa4c]/60
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    transition
                    hover:bg-[#d8aa4c]
                    hover:text-black
                    sm:px-5
                  "
                >
                  Wyloguj się
                </button>

              </div>

            </div>

          </div>

          <div
            className="
              mx-auto
              max-w-[1500px]
              px-4
              py-6
              sm:px-6
              lg:px-8
              lg:py-8
            "
          >

            {/* TYTUŁ I AKCJE */}

            <div
              className="
                flex
                flex-col
                gap-6
                border-b
                border-white/10
                pb-7
                xl:flex-row
                xl:items-start
                xl:justify-between
              "
            >

              <div>

                <h1
                  className="
                    text-3xl
                    font-bold
                    tracking-tight
                    sm:text-4xl
                  "
                >
                  Mój projekt
                </h1>

                <p
                  className="
                    mt-2
                    text-gray-400
                  "
                >
                  Twórz, poprawiaj i realizuj swoje wymarzone wnętrza z AI.
                </p>

              </div>

              <div
                className="
                  flex
                  flex-wrap
                  gap-3
                "
              >

                <button
                  type="button"
                  onClick={saveCurrentProject}
                  disabled={
                    loading ||
                    savingProject ||
                    chat.length === 0
                  }
                  className="
                    rounded-xl
                    bg-gradient-to-r
                    from-[#d8aa4c]
                    to-[#f4ca73]
                    px-5
                    py-3
                    text-sm
                    font-black
                    text-black
                    shadow-lg
                    shadow-[#d8aa4c]/10
                    transition
                    hover:brightness-110
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  {
                    savingProject
                      ? "Zapisywanie..."
                      : "★ Zapisz na później"
                  }
                </button>

                <button
                  type="button"
                  onClick={() =>
                    window.location.href =
                      "/projects"
                  }
                  className="
                    rounded-xl
                    border
                    border-white/15
                    px-5
                    py-3
                    text-sm
                    font-bold
                    text-white
                    transition
                    hover:bg-white/5
                  "
                >
                  Historia projektów
                </button>


                <button
                  type="button"
                  onClick={createNewProject}
                  className="
                    rounded-xl
                    bg-blue-600
                    px-5
                    py-3
                    font-semibold
                    transition
                    hover:bg-blue-500
                  "
                >
                  + Nowy projekt
                </button>

                <button
                  type="button"
                  onClick={() =>
                    window.location.href =
                      "/room-scanner"
                  }
                  className="
                    rounded-xl
                    bg-green-600
                    px-5
                    py-3
                    font-semibold
                    transition
                    hover:bg-green-500
                  "
                >
                  AI Skaner pomieszczeń
                </button>

                <button
                  type="button"
                  onClick={generatePDF}
                  className="
                    rounded-xl
                    bg-white
                    px-5
                    py-3
                    font-semibold
                    text-black
                    transition
                    hover:bg-gray-200
                  "
                >
                  PDF
                </button>

                <button
                  type="button"
                  onClick={deleteCurrentProject}
                  className="
                    rounded-xl
                    bg-red-600
                    px-5
                    py-3
                    font-semibold
                    transition
                    hover:bg-red-500
                  "
                >
                  Usuń projekt
                </button>

              </div>

            </div>

            {/* STATUS */}

            <div
              className="
                mt-5
                inline-flex
                items-center
                gap-3
                rounded-2xl
                border
                border-white/10
                bg-white/[0.03]
                px-5
                py-3
              "
            >

              <div
                className="
                  h-3
                  w-3
                  rounded-full
                  bg-green-400
                  shadow-[0_0_18px_rgba(74,222,128,0.8)]
                "
              />

              <div className="font-semibold">
                Status: {projectStatus}
              </div>

            </div>


            {/* PODSUMOWANIE PROJEKTU */}

            {projectMemory && (

              <div
                className="
                  mt-7
                  grid
                  gap-4
                  sm:grid-cols-2
                  xl:grid-cols-5
                "
              >

                {[
                  {
                    label:
                      "Styl",

                    value:
                      projectMemory?.styl ||
                      "Nie określono",
                  },

                  {
                    label:
                      "Fronty",

                    value:
                      projectMemory?.kolor_frontow ||
                      "Nie określono",
                  },

                  {
                    label:
                      "Blat",

                    value:
                      projectMemory?.blat ||
                      "Nie określono",
                  },

                  {
                    label:
                      "Układ",

                    value:
                      projectMemory?.uklad ||
                      "Nie określono",
                  },

                  {
                    label:
                      "Wersja",

                    value:
                      `v${projectMemory?.version_number || 1}`,
                  },
                ].map(
                  (
                    item
                  ) => (

                    <div
                      key={
                        item.label
                      }
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
                          text-xs
                          font-semibold
                          uppercase
                          tracking-[0.16em]
                          text-gray-500
                        "
                      >
                        {item.label}
                      </div>

                      <div
                        className="
                          mt-2
                          text-lg
                          font-bold
                          text-white
                        "
                      >
                        {item.value}
                      </div>

                    </div>

                  )
                )}

              </div>

            )}

            {/* PLAN TECHNICZNY */}

            {false &&
              latestTechnicalData.furniturePlan && (

              <div
                className="
                  mt-7
                  rounded-3xl
                  border
                  border-white/10
                  bg-[#0c1016]
                  p-5
                  sm:p-6
                "
              >

                <div
                  className="
                    flex
                    flex-col
                    gap-4
                    border-b
                    border-white/10
                    pb-5
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >

                  <div>

                    <div
                      className="
                        text-sm
                        font-semibold
                        uppercase
                        tracking-[0.18em]
                        text-[#d8aa4c]
                      "
                    >
                      Plan techniczny kuchni
                    </div>

                    <h2
                      className="
                        mt-2
                        text-2xl
                        font-black
                      "
                    >
                      Rozmieszczenie mebli co do 1 mm
                    </h2>

                  </div>

                  <div
                    className={`
                      w-fit
                      rounded-full
                      border
                      px-4
                      py-2
                      text-sm
                      font-bold
                      ${
                        latestTechnicalData
                          .furniturePlan
                          .success
                          ? "border-green-500/25 bg-green-500/10 text-green-300"
                          : "border-amber-500/25 bg-amber-500/10 text-amber-300"
                      }
                    `}
                  >
                    {
                      latestTechnicalData
                        .furniturePlan
                        .success
                        ? "Plan dopasowany"
                        : "Wymaga sprawdzenia"
                    }
                  </div>

                </div>

                <div
                  className="
                    mt-6
                    grid
                    gap-6
                  "
                >

                  {(
                    latestTechnicalData
                      .furniturePlan
                      .wallSummaries ||
                    []
                  ).map(
                    (
                      wall: any
                    ) => {

                      const wallModules =
                        (
                          latestTechnicalData
                            .furniturePlan
                            .modules ||
                          []
                        ).filter(
                          (
                            module: any
                          ) =>
                            module.wall ===
                            wall.wall_id
                        );

                      return (

                        <div
                          key={
                            wall.wall_id
                          }
                          className="
                            rounded-2xl
                            border
                            border-white/10
                            bg-black/20
                            p-5
                          "
                        >

                          <div
                            className="
                              flex
                              flex-col
                              gap-3
                              sm:flex-row
                              sm:items-center
                              sm:justify-between
                            "
                          >

                            <div>

                              <div
                                className="
                                  text-xl
                                  font-black
                                "
                              >
                                Ściana {wall.wall_id}
                              </div>

                              <div
                                className="
                                  mt-1
                                  text-sm
                                  text-gray-500
                                "
                              >
                                Długość:
                                {" "}
                                {
                                  wall.wall_length_mm ??
                                  "brak wymiaru"
                                }
                                {
                                  wall.wall_length_mm
                                    ? " mm"
                                    : ""
                                }
                              </div>

                            </div>

                            <div
                              className={`
                                w-fit
                                rounded-xl
                                border
                                px-4
                                py-2
                                text-sm
                                font-bold
                                ${
                                  wall.exact_fit
                                    ? "border-green-500/25 bg-green-500/10 text-green-300"
                                    : "border-white/10 bg-white/5 text-gray-300"
                                }
                              `}
                            >
                              {
                                wall.exact_fit
                                  ? "Różnica: 0 mm"
                                  : `Różnica: ${wall.difference_mm ?? "—"} mm`
                              }
                            </div>

                          </div>

                          <div
                            className="
                              mt-5
                              overflow-x-auto
                            "
                          >

                            <table
                              className="
                                w-full
                                min-w-[760px]
                                border-collapse
                                text-left
                              "
                            >

                              <thead>

                                <tr
                                  className="
                                    border-b
                                    border-white/10
                                    text-xs
                                    uppercase
                                    tracking-[0.14em]
                                    text-gray-500
                                  "
                                >

                                  <th className="px-3 py-3">
                                    Element
                                  </th>

                                  <th className="px-3 py-3">
                                    Szerokość
                                  </th>

                                  <th className="px-3 py-3">
                                    Pozycja od lewej
                                  </th>

                                  <th className="px-3 py-3">
                                    Koniec
                                  </th>

                                  <th className="px-3 py-3">
                                    Rodzaj
                                  </th>

                                </tr>

                              </thead>

                              <tbody>

                                {wallModules.map(
                                  (
                                    module: any
                                  ) => (

                                    <tr
                                      key={
                                        module.id
                                      }
                                      className="
                                        border-b
                                        border-white/5
                                      "
                                    >

                                      <td
                                        className="
                                          px-3
                                          py-4
                                          font-semibold
                                          text-white
                                        "
                                      >
                                        {module.name}
                                      </td>

                                      <td
                                        className="
                                          px-3
                                          py-4
                                          text-[#f0c56e]
                                        "
                                      >
                                        {
                                          module.calculated_width_mm ??
                                          module.width_mm ??
                                          "—"
                                        }
                                        {" "}
                                        mm
                                      </td>

                                      <td
                                        className="
                                          px-3
                                          py-4
                                          text-gray-300
                                        "
                                      >
                                        {
                                          module.position_mm ??
                                          "—"
                                        }
                                        {
                                          module.position_mm !==
                                            null
                                            ? " mm"
                                            : ""
                                        }
                                      </td>

                                      <td
                                        className="
                                          px-3
                                          py-4
                                          text-gray-300
                                        "
                                      >
                                        {
                                          module.end_position_mm ??
                                          "—"
                                        }
                                        {
                                          module.end_position_mm !==
                                            null
                                            ? " mm"
                                            : ""
                                        }
                                      </td>

                                      <td
                                        className="
                                          px-3
                                          py-4
                                          text-gray-500
                                        "
                                      >
                                        {
                                          module.source ===
                                            "calculated"
                                            ? "na wymiar"
                                            : module.source ===
                                                "appliance"
                                              ? "AGD"
                                              : module.source ===
                                                  "filler"
                                                ? "blenda"
                                                : "projekt"
                                        }
                                      </td>

                                    </tr>

                                  )
                                )}

                              </tbody>

                            </table>

                          </div>

                          <div
                            className="
                              mt-5
                              flex
                              flex-wrap
                              gap-3
                              border-t
                              border-white/10
                              pt-4
                              text-sm
                            "
                          >

                            <div
                              className="
                                rounded-xl
                                bg-white/5
                                px-4
                                py-2
                                text-gray-300
                              "
                            >
                              Wykorzystano:
                              {" "}
                              <strong>
                                {wall.used_length_mm} mm
                              </strong>
                            </div>

                            <div
                              className="
                                rounded-xl
                                bg-white/5
                                px-4
                                py-2
                                text-gray-300
                              "
                            >
                              Liczba elementów:
                              {" "}
                              <strong>
                                {wallModules.length}
                              </strong>
                            </div>

                          </div>

                        </div>

                      );
                    }
                  )}

                </div>

                {latestTechnicalData.design && (

                  <div
                    className="
                      mt-6
                      grid
                      gap-4
                      md:grid-cols-2
                    "
                  >

                    <div
                      className="
                        rounded-2xl
                        border
                        border-white/10
                        bg-black/20
                        p-5
                      "
                    >

                      <div
                        className="
                          text-sm
                          font-semibold
                          uppercase
                          tracking-[0.16em]
                          text-gray-500
                        "
                      >
                        Materiały
                      </div>

                      <div
                        className="
                          mt-4
                          space-y-2
                          text-gray-300
                        "
                      >

                        <div>
                          Fronty:
                          {" "}
                          <strong>
                            {
                              latestTechnicalData
                                .design
                                .materials
                                ?.fronts ||
                              "nie określono"
                            }
                          </strong>
                        </div>

                        <div>
                          Blat:
                          {" "}
                          <strong>
                            {
                              latestTechnicalData
                                .design
                                .materials
                                ?.countertop ||
                              "nie określono"
                            }
                          </strong>
                        </div>

                        <div>
                          System otwierania:
                          {" "}
                          <strong>
                            {
                              latestTechnicalData
                                .design
                                .materials
                                ?.handles ||
                              "nie określono"
                            }
                          </strong>
                        </div>

                        <div>
                          Wysłona:
                          {" "}
                          <strong>
                            {
                              latestTechnicalData
                                .design
                                .materials
                                ?.backsplash ||
                              "nie określono"
                            }
                          </strong>
                        </div>

                      </div>

                    </div>

                    {latestTechnicalData.estimate && (

                      <div
                        className="
                          rounded-2xl
                          border
                          border-[#d8aa4c]/25
                          bg-[#d8aa4c]/10
                          p-5
                        "
                      >

                        <div
                          className="
                            text-sm
                            font-semibold
                            uppercase
                            tracking-[0.16em]
                            text-[#f0c56e]
                          "
                        >
                          Szacunkowa wycena
                        </div>

                        <div
                          className="
                            mt-4
                            text-3xl
                            font-black
                            text-white
                          "
                        >
                          {
                            latestTechnicalData
                              .estimate
                              .brutto
                              ?.toLocaleString(
                                "pl-PL"
                              )
                          }
                          {" "}
                          zł brutto
                        </div>

                        <div
                          className="
                            mt-2
                            text-gray-400
                          "
                        >
                          Netto:
                          {" "}
                          {
                            latestTechnicalData
                              .estimate
                              .netto
                              ?.toLocaleString(
                                "pl-PL"
                              )
                          }
                          {" "}
                          zł
                        </div>

                        <div
                          className="
                            mt-4
                            text-sm
                            leading-6
                            text-gray-500
                          "
                        >
                          Wycena orientacyjna. Finalna cena wymaga dokładnego pomiaru i specyfikacji materiałowej.
                        </div>

                      </div>

                    )}

                  </div>

                )}

                {(
                  latestTechnicalData
                    .furniturePlan
                    .issues ||
                  []
                ).length > 0 && (

                  <details
                    className="
                      mt-6
                      rounded-2xl
                      border
                      border-white/10
                      bg-black/20
                      p-5
                    "
                  >

                    <summary
                      className="
                        cursor-pointer
                        font-bold
                        text-gray-300
                      "
                    >
                      Uwagi techniczne
                    </summary>

                    <div
                      className="
                        mt-4
                        space-y-3
                      "
                    >

                      {
                        latestTechnicalData
                          .furniturePlan
                          .issues
                          .map(
                            (
                              issue: any
                            ) => (

                              <div
                                key={
                                  issue.id
                                }
                                className="
                                  rounded-xl
                                  border
                                  border-white/10
                                  bg-white/[0.03]
                                  p-4
                                "
                              >

                                <div
                                  className="
                                    font-semibold
                                    text-white
                                  "
                                >
                                  {issue.title}
                                </div>

                                <div
                                  className="
                                    mt-1
                                    text-sm
                                    leading-6
                                    text-gray-400
                                  "
                                >
                                  {issue.description}
                                </div>

                              </div>

                            )
                          )
                      }

                    </div>

                  </details>

                )}

              </div>

            )}

            {/* WERSJE */}

            <div className="mt-7">
              <ProjectVersions chat={chat} />
            </div>

            {/* ROZMOWA */}

            <div
              className="
                mt-7
                space-y-6
              "
            >

              {chat.length === 0 && (

                <div
                  className="
                    rounded-3xl
                    border
                    border-white/10
                    bg-gradient-to-br
                    from-white/[0.05]
                    to-transparent
                    px-6
                    py-12
                    text-center
                  "
                >

                  <div
                    className="
                      mx-auto
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-[#d8aa4c]/15
                      text-2xl
                    "
                  >
                    ✦
                  </div>

                  <h2
                    className="
                      mt-5
                      text-2xl
                      font-bold
                    "
                  >
                    Zacznij nowy projekt
                  </h2>

                  <p
                    className="
                      mx-auto
                      mt-2
                      max-w-2xl
                      text-gray-400
                    "
                  >
                    Opisz wnętrze, dodaj zdjęcie pomieszczenia i pozwól agentowi AI przygotować wizualizację.
                  </p>

                </div>

              )}

              {chat.map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={index}
                    className="
                      space-y-4
                    "
                  >

                    <div
                      className="
                        ml-auto
                        max-w-[900px]
                        rounded-2xl
                        border
                        border-white/10
                        bg-gradient-to-r
                        from-[#151a22]
                        to-[#1a2029]
                        px-6
                        py-4
                      "
                    >

                      <div
                        className="
                          text-sm
                          text-gray-400
                        "
                      >
                        {
                          item.isCorrection
                            ? "Uwagi klienta"
                            : "Klient"
                        }
                      </div>

                      <div
                        className="
                          mt-1
                          leading-7
                          text-gray-100
                        "
                      >
                        {item.user}
                      </div>

                    </div>

                    <div
                      className="
                        rounded-3xl
                        border
                        border-white/10
                        bg-[#0c1016]
                        p-4
                        sm:p-6
                      "
                    >

                      <div
                        className="
                          flex
                          items-center
                          gap-3
                          font-bold
                        "
                      >

                        <div
                          className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-full
                            bg-[#d8aa4c]/15
                            text-[#f0c56e]
                          "
                        >
                          ✦
                        </div>

                        Projektuj AI

                      </div>

                      <div
                        className="
                          mt-4
                          whitespace-pre-wrap
                          leading-7
                          text-gray-300
                        "
                      >
                        {item.ai}
                      </div>

                      {item.generatedImages?.length > 0 && (

                        <div
                          className="
                            mt-6
                            grid
                            gap-6
                          "
                        >

                          {item.generatedImages.map(
                            (
                              img: string,
                              imgIndex: number
                            ) => (

                              <div
                                key={imgIndex}
                                className="
                                  overflow-hidden
                                  rounded-2xl
                                  border
                                  border-white/10
                                  bg-black
                                "
                              >

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedImage(
                                      img
                                    )
                                  }
                                  className="
                                    block
                                    w-full
                                    cursor-zoom-in
                                  "
                                >

                                  <img
                                    src={`data:image/png;base64,${img}`}
                                    alt={`Wizualizacja ${imgIndex + 1}`}
                                    className="
                                      max-h-[760px]
                                      w-full
                                      object-contain
                                      transition
                                      duration-300
                                      hover:scale-[1.01]
                                    "
                                  />

                                </button>

                                <div
                                  className="
                                    flex
                                    flex-wrap
                                    gap-3
                                    border-t
                                    border-white/10
                                    bg-[#0b0e13]
                                    p-3
                                  "
                                >

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedImage(
                                        img
                                      )
                                    }
                                    className="
                                      rounded-xl
                                      border
                                      border-white/15
                                      px-5
                                      py-3
                                      font-semibold
                                      transition
                                      hover:bg-white/5
                                    "
                                  >
                                    Powiększ
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      downloadImage(
                                        img,
                                        `Projektuj-AI-${index + 1}-${imgIndex + 1}.png`
                                      )
                                    }
                                    className="
                                      rounded-xl
                                      border
                                      border-white/15
                                      px-5
                                      py-3
                                      font-semibold
                                      transition
                                      hover:bg-white/5
                                    "
                                  >
                                    Pobierz
                                  </button>

                                  {item.selectedVariant !==
                                    img && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        chooseProjectVariant(
                                          index,
                                          img
                                        )
                                      }
                                      disabled={
                                        finalizingIndex !==
                                          null ||
                                        selectingIndex !==
                                          null
                                      }
                                      className="
                                        ml-auto
                                        rounded-xl
                                        bg-[#d8aa4c]
                                        px-5
                                        py-3
                                        font-bold
                                        text-black
                                        transition
                                        hover:bg-[#f0c56e]
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                      "
                                    >
                                      {
                                        selectingIndex ===
                                        index
                                          ? "Analizuję wybrany projekt..."
                                          : "✓ Wybierz ten projekt"
                                      }
                                    </button>
                                  )}

                                  {item.selectedVariant ===
                                    img && (
                                      <div
                                        className="
                                          ml-auto
                                          rounded-xl
                                          border
                                          border-emerald-400/30
                                          bg-emerald-400/10
                                          px-5
                                          py-3
                                          font-bold
                                          text-emerald-300
                                        "
                                      >
                                        ✓ Wybrany do dalszej pracy
                                      </div>
                                    )}

                                </div>

                              </div>

                            )
                          )}

                        </div>

                      )}

                      {item.finalized &&
                        item.finalizedImages?.length >
                          0 && (
                        <div
                          className="
                            mt-8
                            rounded-3xl
                            border
                            border-[#d8aa4c]/30
                            bg-[#d8aa4c]/5
                            p-5
                          "
                        >
                          <div
                            className="
                              text-lg
                              font-bold
                              text-[#f0c56e]
                            "
                          >
                            Zatwierdzony projekt — dodatkowe ujęcia
                          </div>

                          <p
                            className="
                              mt-2
                              text-sm
                              text-gray-400
                            "
                          >
                            Te ujęcia zostały przygotowane dopiero po zatwierdzeniu wybranej i poprawionej kuchni. PDF zawiera wyłącznie tę wersję projektu.
                          </p>

                          <div
                            className="
                              mt-5
                              grid
                              gap-5
                              md:grid-cols-2
                            "
                          >
                            {item.finalizedImages.map(
                              (
                                finalImg: string,
                                finalIndex: number
                              ) => (
                                <div
                                  key={finalIndex}
                                  className="
                                    overflow-hidden
                                    rounded-2xl
                                    border
                                    border-white/10
                                    bg-black
                                  "
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedImage(
                                        finalImg
                                      )
                                    }
                                    className="
                                      block
                                      w-full
                                      cursor-zoom-in
                                    "
                                  >
                                    <img
                                      src={`data:image/png;base64,${finalImg}`}
                                      alt={`Ujęcie wybranego projektu ${finalIndex + 1}`}
                                      className="
                                        max-h-[620px]
                                        w-full
                                        object-contain
                                      "
                                    />
                                  </button>

                                  <div
                                    className="
                                      flex
                                      items-center
                                      justify-between
                                      gap-3
                                      border-t
                                      border-white/10
                                      p-3
                                    "
                                  >
                                    <span
                                      className="
                                        text-sm
                                        font-semibold
                                        text-gray-300
                                      "
                                    >
                                      Ujęcie {finalIndex + 1}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        downloadImage(
                                          finalImg,
                                          `DreamS-AI-wybrany-projekt-${finalIndex + 1}.png`
                                        )
                                      }
                                      className="
                                        rounded-xl
                                        border
                                        border-white/15
                                        px-4
                                        py-2
                                        text-sm
                                        font-semibold
                                        hover:bg-white/5
                                      "
                                    >
                                      Pobierz
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={
                              generatePDF
                            }
                            className="
                              mt-5
                              w-full
                              rounded-2xl
                              bg-white
                              px-5
                              py-4
                              font-bold
                              text-black
                              transition
                              hover:bg-gray-200
                            "
                          >
                            Pobierz PDF z projektem i specyfikacją
                          </button>
                        </div>
                      )}

                    </div>

                  </div>

                )
              )}

            </div>

            {/* OPIS WYBRANEGO PROJEKTU */}

            {(() => {

              const selected =
                getSelectedProjectForFinalization();

              if (
                !selected
              ) {

                return null;
              }

              const specification =
                selected.item
                  ?.selectedSpecification ||
                null;

              const modules =
                Array.isArray(
                  selected.item
                    ?.selectedModules
                )
                  ? selected.item
                      .selectedModules
                  : [];

              if (
                !specification &&
                modules.length ===
                  0
              ) {

                return null;
              }

              const detail = (
                label: string,
                value: any
              ) => {

                if (
                  value ===
                    undefined ||
                  value ===
                    null ||
                  value ===
                    ""
                ) {

                  return null;
                }

                return (
                  <div
                    className="
                      rounded-2xl
                      border
                      border-white/10
                      bg-black/20
                      p-4
                    "
                  >
                    <div
                      className="
                        text-xs
                        font-bold
                        uppercase
                        tracking-[0.14em]
                        text-gray-500
                      "
                    >
                      {label}
                    </div>

                    <div
                      className="
                        mt-2
                        font-semibold
                        text-white
                      "
                    >
                      {
                        Array.isArray(
                          value
                        )
                          ? value.join(
                              ", "
                            )
                          : String(
                              value
                            )
                      }
                    </div>
                  </div>
                );
              };

              return (

                <div
                  className="
                    mt-7
                    rounded-3xl
                    border
                    border-emerald-400/20
                    bg-[#0c1016]
                    p-5
                    sm:p-6
                  "
                >

                  <div
                    className="
                      border-b
                      border-white/10
                      pb-5
                    "
                  >
                    <div
                      className="
                        text-sm
                        font-black
                        uppercase
                        tracking-[0.18em]
                        text-emerald-300
                      "
                    >
                      Wybrany wariant
                    </div>

                    <h2
                      className="
                        mt-2
                        text-2xl
                        font-black
                      "
                    >
                      Opis dokładnie tej kuchni
                    </h2>

                    <p
                      className="
                        mt-2
                        text-gray-400
                      "
                    >
                      Ten opis został przygotowany dopiero po wyborze wariantu i dotyczy zdjęcia oznaczonego jako „Wybrany do dalszej pracy”.
                    </p>
                  </div>

                  {specification && (

                    <div
                      className="
                        mt-5
                        grid
                        gap-3
                        sm:grid-cols-2
                        xl:grid-cols-3
                      "
                    >
                      {detail(
                        "Styl",
                        specification.style
                      )}

                      {detail(
                        "Kolor frontów",
                        specification.frontColor
                      )}

                      {detail(
                        "RAL frontów",
                        specification.frontRal
                      )}

                      {detail(
                        "Wykończenie",
                        specification.frontFinish
                      )}

                      {detail(
                        "Materiał frontów",
                        specification.frontMaterial
                      )}

                      {detail(
                        "Płyta / dekor",
                        specification.board
                      )}

                      {detail(
                        "Producent płyty",
                        specification.boardManufacturer
                      )}

                      {detail(
                        "Kod dekoru",
                        specification.boardCode
                      )}

                      {detail(
                        "Nazwa dekoru",
                        specification.boardName
                      )}

                      {detail(
                        "Struktura",
                        specification.boardTexture
                      )}

                      {detail(
                        "Blat",
                        specification.countertop
                      )}

                      {detail(
                        "Blat — producent",
                        specification.countertopManufacturer
                      )}

                      {detail(
                        "Blat — kod",
                        specification.countertopCode
                      )}

                      {detail(
                        "Uchwyty / otwieranie",
                        specification.handles
                      )}

                      {detail(
                        "Cokół",
                        specification.plinth
                      )}

                      {detail(
                        "Ściana nad blatem",
                        specification.backsplash
                      )}

                      {detail(
                        "Oświetlenie",
                        specification.lighting
                      )}

                      {detail(
                        "AGD",
                        specification.appliances
                      )}
                    </div>

                  )}

                  {specification?.colorMatchNote && (
                    <div
                      className="
                        mt-4 rounded-2xl border border-[#d8aa4c]/25
                        bg-[#d8aa4c]/10 p-4 text-sm leading-6 text-[#f2d28e]
                      "
                    >
                      <strong>Ważne przy zamówieniu:</strong>{" "}
                      {specification.colorMatchNote}
                    </div>
                  )}

                  {modules.length >
                    0 && (

                    <div
                      className="
                        mt-7
                      "
                    >

                      <h3
                        className="
                          text-xl
                          font-black
                        "
                      >
                        Bryły po kolei
                      </h3>

                      <p
                        className="
                          mt-2
                          text-sm
                          text-gray-400
                        "
                      >
                        Kolejność została odczytana z wybranego zdjęcia. Jeśli elementu nie da się pewnie rozpoznać, system oznacza go jako wymagający potwierdzenia.
                      </p>

                      <div
                        className="
                          mt-4
                          grid
                          gap-3
                        "
                      >
                        {modules.map(
                          (
                            module: any,
                            moduleIndex:
                              number
                          ) => (

                            <div
                              key={
                                `${moduleIndex}-${module?.name || "modul"}`
                              }
                              className="
                                flex
                                flex-col
                                gap-2
                                rounded-2xl
                                border
                                border-white/10
                                bg-black/20
                                p-4
                                sm:flex-row
                                sm:items-center
                                sm:justify-between
                              "
                            >

                              <div>

                                <div
                                  className="
                                    font-black
                                    text-white
                                  "
                                >
                                  {moduleIndex + 1}. {
                                    module?.name ||
                                    "Moduł"
                                  }
                                </div>

                                <div
                                  className="
                                    mt-1
                                    text-sm
                                    text-gray-400
                                  "
                                >
                                  {
                                    module?.description ||
                                    ""
                                  }
                                </div>

                              </div>

                              <div
                                className="
                                  text-sm
                                  font-semibold
                                  text-[#f0c56e]
                                "
                              >
                                {
                                  module?.wall
                                    ? `Ściana ${module.wall}`
                                    : ""
                                }
                              </div>

                            </div>

                          )
                        )}
                      </div>

                    </div>

                  )}

                </div>

              );
            })()}

            {/* WYBRANY PROJEKT - KOLEJNOŚĆ PRACY */}

            {getSelectedProjectForFinalization() && (

              <div
                className="
                  mt-7
                  rounded-3xl
                  border
                  border-[#d8aa4c]/35
                  bg-gradient-to-r
                  from-[#d8aa4c]/10
                  to-white/[0.03]
                  p-5
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
                        font-black
                        uppercase
                        tracking-[0.18em]
                        text-[#d8aa4c]
                      "
                    >
                      Wybrany projekt
                    </div>

                    <h2
                      className="
                        mt-2
                        text-2xl
                        font-black
                      "
                    >
                      Najpierw popraw, potem zatwierdź
                    </h2>

                    <p
                      className="
                        mt-2
                        max-w-3xl
                        text-gray-400
                      "
                    >
                      Wszystkie poprawki poniżej dotyczą teraz wyłącznie wybranej kuchni.
                      Dopiero po kliknięciu „Zatwierdź projekt” wygenerujemy dodatkowe ujęcia
                      tej samej kuchni i przygotujemy PDF.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      approveSelectedProject
                    }
                    disabled={
                      loading ||
                      finalizingIndex !==
                        null
                    }
                    className="
                      shrink-0
                      rounded-2xl
                      bg-gradient-to-r
                      from-[#d8aa4c]
                      to-[#f4ca73]
                      px-7
                      py-4
                      font-black
                      text-black
                      transition
                      hover:brightness-110
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {
                      finalizingIndex !==
                      null
                        ? "Przygotowuję ujęcia..."
                        : "✓ Zatwierdź projekt"
                    }
                  </button>

                </div>

              </div>

            )}

            {/* POPRAWKI */}

            {hasVisualization && (

              <div
                className="
                  mt-7
                  rounded-3xl
                  border
                  border-white/10
                  bg-[#0c1016]
                  p-5
                  sm:p-6
                "
              >

                <h2
                  className="
                    text-xl
                    font-bold
                  "
                >
                  Masz uwagi do projektu?
                </h2>

                <p
                  className="
                    mt-2
                    text-gray-400
                  "
                >
                  Napisz, co chcesz zmienić. Zachowamy cały projekt i zmienimy tylko wskazane elementy.
                </p>


                <div
                  className="
                    mt-5
                    flex
                    flex-wrap
                    gap-3
                  "
                >

                  {[
                    "Jaśniejsze fronty",
                    "Więcej drewna",
                    "Zmień blat na drewniany",
                    "Dodaj witrynę",
                    "Usuń witrynę",
                    "Powiększ wyspę",
                    "Dodaj więcej LED",
                  ].map(
                    (
                      correction
                    ) => (

                      <button
                        key={
                          correction
                        }
                        type="button"
                        onClick={() =>
                          applyQuickCorrection(
                            correction
                          )
                        }
                        className="
                          rounded-full
                          border
                          border-[#d8aa4c]/30
                          bg-[#d8aa4c]/10
                          px-4
                          py-2
                          text-sm
                          font-semibold
                          text-[#f0c56e]
                          transition
                          hover:bg-[#d8aa4c]/20
                        "
                      >
                        {correction}
                      </button>

                    )
                  )}

                </div>

                <div
                  className="
                    mt-5
                    flex
                    flex-col
                    gap-3
                    lg:flex-row
                  "
                >

                  <textarea
                    value={correctionMessage}
                    onChange={(e) =>
                      setCorrectionMessage(
                        e.target.value
                      )
                    }
                    placeholder="Np. jaśniejsze fronty, dodaj witrynę, zmień blat na drewniany..."
                    className="
                      min-h-[110px]
                      flex-1
                      resize-y
                      rounded-2xl
                      border
                      border-white/10
                      bg-[#161b22]
                      px-5
                      py-4
                      text-white
                      outline-none
                      placeholder:text-gray-500
                      focus:border-green-500
                      lg:min-h-[64px]
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      sendMessage(
                        correctionMessage,
                        true
                      )
                    }
                    disabled={
                      loading ||
                      !correctionMessage.trim()
                    }
                    className="
                      rounded-2xl
                      bg-green-600
                      px-7
                      py-4
                      font-bold
                      transition
                      hover:bg-green-500
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {
                      loading
                        ? "Generuję poprawioną wizualizację..."
                        : "Popraw wizualizację"
                    }
                  </button>

                </div>

              </div>

            )}


            {hasVisualization && (

              <div
                className="
                  mt-7
                  grid
                  gap-6
                  xl:grid-cols-2
                "
              >

                <div
                  className="
                    rounded-3xl
                    border
                    border-white/10
                    bg-[#0c1016]
                    p-6
                  "
                >

                  <h2
                    className="
                      text-xl
                      font-bold
                    "
                  >
                    Oceń projekt AI
                  </h2>

                  <p
                    className="
                      mt-2
                      text-gray-400
                    "
                  >
                    Twoja ocena pomoże nam poprawiać jakość kolejnych wizualizacji.
                  </p>

                  <div
                    className="
                      mt-5
                      flex
                      gap-2
                    "
                  >

                    {[1, 2, 3, 4, 5].map(
                      (
                        rating
                      ) => (

                        <button
                          key={
                            rating
                          }
                          type="button"
                          onClick={() =>
                            rateProject(
                              rating
                            )
                          }
                          className={`
                            text-3xl
                            transition
                            ${
                              rating <= projectRating
                                ? "text-[#f0c56e]"
                                : "text-gray-700 hover:text-[#d8aa4c]"
                            }
                          `}
                        >
                          ★
                        </button>

                      )
                    )}

                  </div>

                </div>

                <div
                  className="
                    rounded-3xl
                    border
                    border-[#d8aa4c]/25
                    bg-gradient-to-br
                    from-[#d8aa4c]/10
                    to-transparent
                    p-6
                  "
                >

                  <h2
                    className="
                      text-xl
                      font-bold
                      text-[#f0c56e]
                    "
                  >
                    Projekt jest gotowy?
                  </h2>

                  <p
                    className="
                      mt-2
                      text-gray-300
                    "
                  >
                    Wyślij projekt do wyceny i omów realizację z naszym zespołem.
                  </p>

                  <button
                    type="button"
                    onClick={
                      orderProject
                    }
                    className="
                      mt-5
                      w-full
                      rounded-2xl
                      bg-gradient-to-r
                      from-[#d8aa4c]
                      to-[#f4ca73]
                      px-7
                      py-4
                      font-black
                      text-black
                      transition
                      hover:brightness-110
                    "
                  >
                    Zamów ten projekt
                  </button>

                </div>

              </div>

            )}

            {/* NOWA WIADOMOŚĆ */}

            <div
              className="
                mt-7
                rounded-3xl
                border
                border-white/10
                bg-[#0c1016]
                p-5
                sm:p-6
              "
            >

              <div
                className="
                  flex
                  flex-col
                  gap-5
                "
              >

                <label
                  className="
                    flex
                    cursor-pointer
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-dashed
                    border-white/20
                    bg-white/[0.03]
                    px-5
                    py-4
                    text-center
                    font-semibold
                    text-gray-300
                    transition
                    hover:border-[#d8aa4c]/50
                    hover:bg-[#d8aa4c]/5
                  "
                >

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {

                      const files =
                        Array.from(
                          e.target.files || []
                        );

                      if (
                        !files.length
                      ) return;

                      const converted =
                        await Promise.all(

                          files.map(
                            (file) => {

                              return new Promise<string>(
                                (resolve) => {

                                  const reader =
                                    new FileReader();

                                  reader.onloadend =
                                    () => {

                                      resolve(
                                        String(
                                          reader.result
                                        )
                                      );
                                    };

                                  reader.readAsDataURL(
                                    file
                                  );
                                }
                              );
                            }
                          )
                        );

                      setImages(
                        (
                          previousImages
                        ) => [
                          ...previousImages,
                          ...converted,
                        ]
                      );

                      e.target.value =
                        "";
                    }}
                  />

                  {images.length > 0
                    ? "＋ Dodaj kolejne zdjęcie"
                    : "＋ Dodaj zdjęcia pomieszczenia"}

                </label>

                {images.length > 0 && (

                  <div
                    className="
                      space-y-4
                    "
                  >

                    <div
                      className="
                        flex
                        flex-wrap
                        items-center
                        justify-between
                        gap-3
                      "
                    >

                      <div
                        className="
                          text-sm
                          text-gray-400
                        "
                      >
                        Dodane zdjęcia: {images.length}
                      </div>

                      <div
                        className="
                          flex
                          flex-wrap
                          gap-2
                        "
                      >

                        <label
                          className="
                            cursor-pointer
                            rounded-xl
                            border
                            border-[#d8aa4c]/40
                            bg-[#d8aa4c]/10
                            px-4
                            py-2
                            text-sm
                            font-semibold
                            text-[#f0c56e]
                            transition
                            hover:bg-[#d8aa4c]/20
                          "
                        >
                          ＋ Dodaj kolejne

                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const files =
                                Array.from(
                                  e.target.files || []
                                );

                              if (!files.length) {
                                return;
                              }

                              const converted =
                                await Promise.all(
                                  files.map(
                                    (file) =>
                                      new Promise<string>(
                                        (resolve) => {
                                          const reader =
                                            new FileReader();

                                          reader.onloadend =
                                            () =>
                                              resolve(
                                                String(
                                                  reader.result
                                                )
                                              );

                                          reader.readAsDataURL(
                                            file
                                          );
                                        }
                                      )
                                  )
                                );

                              setImages(
                                (
                                  previousImages
                                ) => [
                                  ...previousImages,
                                  ...converted,
                                ]
                              );

                              e.target.value =
                                "";
                            }}
                          />
                        </label>

                      <button
                        type="button"
                        onClick={() =>
                          setImages(
                            []
                          )
                        }
                        className="
                          rounded-xl
                          border
                          border-red-500/30
                          bg-red-500/10
                          px-4
                          py-2
                          text-sm
                          font-semibold
                          text-red-300
                          transition
                          hover:bg-red-500/20
                        "
                      >
                        Usuń wszystkie
                      </button>

                      </div>

                    </div>

                    <div
                      className="
                        grid
                        grid-cols-2
                        gap-4
                        md:grid-cols-4
                      "
                    >

                      {images.map(
                        (
                          img,
                          index
                        ) => (

                          <div
                            key={`${index}-${img.slice(0, 30)}`}
                            className="
                              group
                              relative
                              overflow-hidden
                              rounded-2xl
                              border
                              border-white/10
                              bg-black
                            "
                          >

                            <img
                              src={img}
                              alt={`Załącznik ${index + 1}`}
                              className="
                                aspect-square
                                w-full
                                object-cover
                              "
                            />

                            <div
                              className="
                                pointer-events-none
                                absolute
                                inset-x-0
                                bottom-0
                                bg-gradient-to-t
                                from-black/80
                                to-transparent
                                px-3
                                pb-3
                                pt-8
                                text-xs
                                text-gray-300
                              "
                            >
                              Zdjęcie {index + 1}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setImages(
                                  (
                                    previousImages
                                  ) =>
                                    previousImages.filter(
                                      (
                                        _,
                                        imageIndex
                                      ) =>
                                        imageIndex !==
                                        index
                                    )
                                )
                              }
                              aria-label={`Usuń zdjęcie ${index + 1}`}
                              title="Usuń zdjęcie"
                              className="
                                absolute
                                right-2
                                top-2
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-full
                                border
                                border-white/20
                                bg-black/80
                                text-lg
                                font-bold
                                text-white
                                shadow-lg
                                transition
                                hover:bg-red-600
                              "
                            >
                              ×
                            </button>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                )}

                {loading && (

                  <div
                    className="
                      flex
                      items-center
                      gap-4
                      rounded-2xl
                      border
                      border-blue-500/20
                      bg-blue-500/10
                      p-5
                    "
                  >

                    <div
                      className="
                        h-6
                        w-6
                        animate-spin
                        rounded-full
                        border-2
                        border-blue-400
                        border-t-transparent
                      "
                    />

                    <div>

                      <div
                        className="
                          font-bold
                          text-blue-300
                        "
                      >
                        Projektuj AI pracuje...
                      </div>

                      <div
                        className="
                          mt-1
                          text-sm
                          text-gray-400
                        "
                      >
                        Analizujemy pomieszczenie i przygotowujemy wizualizację.
                      </div>

                    </div>

                  </div>

                )}

                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    lg:flex-row
                  "
                >

                  <input
                    value={message}
                    onChange={(e) =>
                      setMessage(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {

                      if (
                        e.key === "Enter"
                      ) {

                        sendMessage();
                      }
                    }}
                    placeholder={
                      hasVisualization
                        ? "Napisz kolejną wiadomość do projektanta AI..."
                        : "Opisz swoje wymarzone wnętrze..."
                    }
                    className="
                      min-h-[62px]
                      flex-1
                      rounded-2xl
                      border
                      border-white/10
                      bg-[#161b22]
                      px-5
                      text-white
                      outline-none
                      placeholder:text-gray-500
                      focus:border-[#d8aa4c]/60
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      sendMessage()
                    }
                    disabled={
                      loading ||
                      !message.trim()
                    }
                    className="
                      min-w-[200px]
                      rounded-2xl
                      bg-gradient-to-r
                      from-[#d8aa4c]
                      to-[#f2c66d]
                      px-8
                      py-4
                      font-bold
                      text-black
                      transition
                      hover:brightness-110
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {
                      loading
                        ? "Projektowanie..."
                        : "Wyślij"
                    }
                  </button>

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>


      {showProfilePanel && (

        <div
          className="
            fixed
            inset-0
            z-[120]
            flex
            items-center
            justify-center
            bg-black/90
            p-4
          "
          onClick={() =>
            setShowProfilePanel(
              false
            )
          }
        >

          <div
            className="
              max-h-[92vh]
              w-full
              max-w-3xl
              overflow-y-auto
              rounded-[28px]
              border
              border-white/10
              bg-[#0c1016]
              p-6
              shadow-2xl
              sm:p-8
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >

              <div>

                <div
                  className="
                    text-sm
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-[#d8aa4c]
                  "
                >
                  Konto użytkownika
                </div>

                <h2
                  className="
                    mt-2
                    text-3xl
                    font-black
                  "
                >
                  Moje dane
                </h2>

                <p
                  className="
                    mt-2
                    text-gray-400
                  "
                >
                  Dane będą używane przy projektach, wycenach i zapytaniach o realizację.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowProfilePanel(
                    false
                  )
                }
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/15
                  text-xl
                "
              >
                ×
              </button>

            </div>

            <div
              className="
                mt-7
                grid
                gap-4
                sm:grid-cols-2
              "
            >

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-300
                  "
                >
                  Imię i nazwisko
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Jan Kowalski"
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#161b22]
                    px-5
                    py-4
                    outline-none
                    focus:border-[#d8aa4c]/60
                  "
                />

              </div>

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-300
                  "
                >
                  E-mail
                </label>

                <input
                  value={email}
                  readOnly
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#161b22]
                    px-5
                    py-4
                    text-gray-500
                  "
                />

              </div>

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-300
                  "
                >
                  Telefon
                </label>

                <input
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="+48 600 000 000"
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#161b22]
                    px-5
                    py-4
                    outline-none
                    focus:border-[#d8aa4c]/60
                  "
                />

              </div>

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-300
                  "
                >
                  Miejscowość
                </label>

                <input
                  value={city}
                  onChange={(event) =>
                    setCity(
                      event.target.value
                    )
                  }
                  placeholder="Chojnice"
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#161b22]
                    px-5
                    py-4
                    outline-none
                    focus:border-[#d8aa4c]/60
                  "
                />

              </div>

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-300
                  "
                >
                  Adres
                </label>

                <input
                  value={address}
                  onChange={(event) =>
                    setAddress(
                      event.target.value
                    )
                  }
                  placeholder="Ulica i numer"
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#161b22]
                    px-5
                    py-4
                    outline-none
                    focus:border-[#d8aa4c]/60
                  "
                />

              </div>

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-300
                  "
                >
                  Kod pocztowy
                </label>

                <input
                  value={postalCode}
                  onChange={(event) =>
                    setPostalCode(
                      event.target.value
                    )
                  }
                  placeholder="89-600"
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#161b22]
                    px-5
                    py-4
                    outline-none
                    focus:border-[#d8aa4c]/60
                  "
                />

              </div>

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-300
                  "
                >
                  Firma
                </label>

                <input
                  value={company}
                  onChange={(event) =>
                    setCompany(
                      event.target.value
                    )
                  }
                  placeholder="Nazwa firmy"
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#161b22]
                    px-5
                    py-4
                    outline-none
                    focus:border-[#d8aa4c]/60
                  "
                />

              </div>

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-300
                  "
                >
                  NIP
                </label>

                <input
                  value={nip}
                  onChange={(event) =>
                    setNip(
                      event.target.value
                    )
                  }
                  placeholder="0000000000"
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#161b22]
                    px-5
                    py-4
                    outline-none
                    focus:border-[#d8aa4c]/60
                  "
                />

              </div>

            </div>

            <div
              className="
                mt-7
                flex
                flex-col-reverse
                gap-3
                sm:flex-row
                sm:justify-end
              "
            >

              <button
                type="button"
                onClick={() =>
                  setShowProfilePanel(
                    false
                  )
                }
                className="
                  rounded-2xl
                  border
                  border-white/15
                  px-6
                  py-4
                  font-semibold
                  transition
                  hover:bg-white/5
                "
              >
                Anuluj
              </button>

              <button
                type="button"
                onClick={
                  saveProfileData
                }
                disabled={
                  profileSaving
                }
                className="
                  rounded-2xl
                  bg-gradient-to-r
                  from-[#d8aa4c]
                  to-[#f4ca73]
                  px-7
                  py-4
                  font-black
                  text-black
                  transition
                  hover:brightness-110
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {
                  profileSaving
                    ? "Zapisywanie..."
                    : "Zapisz dane"
                }
              </button>

            </div>

          </div>

        </div>

      )}

      {showOrderPanel && (

        <div
          className="
            fixed
            inset-0
            z-[110]
            flex
            items-center
            justify-center
            bg-black/90
            p-4
          "
          onClick={() =>
            setShowOrderPanel(
              false
            )
          }
        >

          <div
            className="
              w-full
              max-w-2xl
              rounded-[28px]
              border
              border-white/10
              bg-[#0c1016]
              p-6
              shadow-2xl
              sm:p-8
            "
            onClick={(event) =>
              event.stopPropagation()
            }
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
                    text-sm
                    font-semibold
                    uppercase
                    tracking-[0.18em]
                    text-[#d8aa4c]
                  "
                >
                  Zapytanie o realizację
                </div>

                <h2
                  className="
                    mt-2
                    text-2xl
                    font-black
                  "
                >
                  Zamów ten projekt
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowOrderPanel(
                    false
                  )
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/15
                  text-xl
                "
              >
                ×
              </button>

            </div>

            <div
              className="
                mt-6
                grid
                gap-4
                sm:grid-cols-2
              "
            >

              <input
                value={
                  name
                }
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Imię i nazwisko"
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#161b22]
                  px-5
                  py-4
                  outline-none
                  focus:border-[#d8aa4c]/60
                "
              />

              <input
                value={
                  phone
                }
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                placeholder="Numer telefonu"
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#161b22]
                  px-5
                  py-4
                  outline-none
                  focus:border-[#d8aa4c]/60
                "
              />

              <input
                value={
                  city
                }
                onChange={(event) =>
                  setCity(
                    event.target.value
                  )
                }
                placeholder="Miejscowość"
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#161b22]
                  px-5
                  py-4
                  outline-none
                  focus:border-[#d8aa4c]/60
                "
              />

              <input
                value={
                  email
                }
                readOnly
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#161b22]
                  px-5
                  py-4
                  text-gray-400
                "
              />

            </div>

            <textarea
              value={
                orderMessage
              }
              onChange={(event) =>
                setOrderMessage(
                  event.target.value
                )
              }
              placeholder="Dodatkowe uwagi do realizacji..."
              className="
                mt-4
                min-h-[130px]
                w-full
                rounded-2xl
                border
                border-white/10
                bg-[#161b22]
                px-5
                py-4
                outline-none
                focus:border-[#d8aa4c]/60
              "
            />

            <button
              type="button"
              onClick={
                sendOrderRequest
              }
              className="
                mt-5
                w-full
                rounded-2xl
                bg-gradient-to-r
                from-[#d8aa4c]
                to-[#f4ca73]
                px-7
                py-4
                font-black
                text-black
                transition
                hover:brightness-110
              "
            >
              Wyślij zapytanie
            </button>

          </div>

        </div>

      )}

      {/* PODGLĄD PEŁNOEKRANOWY */}

      {selectedImage && (

        <div
          className="
            fixed
            inset-0
            z-[100]
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
            onClick={(e) =>
              e.stopPropagation()
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
              alt="Powiększona wizualizacja"
              className="
                max-h-[84vh]
                max-w-full
                rounded-2xl
                object-contain
                shadow-2xl
              "
            />

            <button
              type="button"
              onClick={() =>
                downloadImage(
                  selectedImage,
                  "Projektuj-AI-wizualizacja.png"
                )
              }
              className="
                rounded-2xl
                bg-white
                px-8
                py-4
                font-bold
                text-black
                transition
                hover:bg-gray-200
              "
            >
              Pobierz zdjęcie
            </button>

          </div>

        </div>

      )}

    </main>
  );
}