import OpenAI from "openai";
import { addLogoToImage } from "@/lib/addLogo";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function calculateFurnitureEstimate(
  text: string
) {

  let netto = 25000;

  const lower =
    text.toLowerCase();

  if (
    lower.includes("premium")
  ) {
    netto += 6000;
  }

  if (
    lower.includes("blum")
  ) {
    netto += 4500;
  }

  if (
    lower.includes("cargo")
  ) {
    netto += 2500;
  }

  if (
    lower.includes("led")
  ) {
    netto += 1200;
  }

  if (
    lower.includes("spiek")
  ) {
    netto += 9000;
  }

  if (
    lower.includes("wyspa")
  ) {
    netto += 7000;
  }

  if (
    lower.includes("akryl")
  ) {
    netto += 3500;
  }

  netto += 4500;

  const brutto =
    Math.round(
      netto * 1.08
    );

  return {

    netto,
    brutto,
  };
}

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json();

    const {
      message,
      history = [],
      name,
      phone,
      city,
      email,
    } = body;

    const conversation = [

      ...history.map(
        (item: any) => `
KLIENT:
${item.user}

DREAMS AI:
${item.ai}
`
      ),

      `
KLIENT:
${message}
`,
    ].join("\n");

    const lowerConversation =
      conversation.toLowerCase();

    const generateProject =

      lowerConversation.includes(
        "stwórz projekt"
      )

      ||

      lowerConversation.includes(
        "wygeneruj projekt"
      )

      ||

      lowerConversation.includes(
        "generuj wizualizację"
      )

      ||

      lowerConversation.includes(
        "pokaż projekt"
      )

      ||

      lowerConversation.includes(
        "zrób wizualizację"
      )

      ||

      lowerConversation.includes(
        "wizualizacja"
      )

      ||

      lowerConversation.includes(
        "projekt gotowy"
      );

    // =========================
    // CONSULTATION
    // =========================

    if (!generateProject) {

      const consultation =
        await openai.chat.completions.create({

          model:
            "gpt-4.1-mini",

          messages: [

            {
              role: "system",

              content: `

Jesteś profesjonalnym projektantem kuchni premium DreamS AI.

Twoim zadaniem jest:
- prowadzić konsultację,
- analizować potrzeby klienta,
- zapamiętywać wszystkie ustalenia,
- zachowywać się jak profesjonalny projektant kuchni na wymiar.

BARDZO WAŻNE:

- słuchaj klienta,
- analizuj CAŁĄ rozmowę,
- NIE ignoruj wcześniejszych ustaleń,
- jeśli klient zmienia zdanie — uwzględnij OSTATNIĄ wersję,
- NIE pytaj drugi raz o rzeczy które klient już podał,
- przed zadaniem pytania przeanalizuj historię rozmowy,
- zadawaj maksymalnie 2 pytania naraz,
- nie generuj jeszcze wizualizacji,
- nie podawaj jeszcze wyceny.

Pytaj o:
- styl,
- kolory,
- układ,
- AGD,
- wyspę,
- oświetlenie,
- budżet,
- funkcjonalność,
- wymiary,
- materiały.

`,
            },

            {
              role: "user",

              content: `

Imię:
${name}

Telefon:
${phone}

Miasto:
${city}

Email:
${email}

ROZMOWA:

${conversation}

`,
            },
          ],

          temperature: 1,
        });

      return Response.json({

        success: true,

        reply:
          consultation
            .choices[0]
            .message.content,

        generatedImage:
          null,
      });
    }

    // =========================
    // PROJECT
    // =========================

    const project =
      await openai.chat.completions.create({

        model:
          "gpt-4.1-mini",

        messages: [

          {
            role: "system",

            content: `

Jesteś profesjonalnym projektantem kuchni premium.

BARDZO WAŻNE:

- projektuj jak producent mebli na wymiar,
- zachowaj realistyczne proporcje,
- zachowaj poprawne głębokości zabudowy,
- nie zostawiaj pustych przestrzeni,
- narożniki muszą być logiczne,
- zachowaj ciągłość blatów,
- projekt ma być możliwy do wykonania,
- unikaj błędów stolarskich,
- zachowaj ergonomię,
- górne i dolne szafki muszą być spójne.

Jeśli klient prosi o poprawki:
- zachowaj istniejący projekt,
- zmień tylko wskazane elementy,
- nie twórz zupełnie nowej kuchni.

`,
          },

          {
            role: "user",

            content: `

ROZMOWA:

${conversation}

`,
          },
        ],

        temperature: 1,
      });

    const aiReply =
      project.choices[0]
        .message.content ||

      "Brak odpowiedzi AI";

    // =========================
    // IMAGE
    // =========================

    let generatedImage =
      null;

    try {

      const imagePrompt = `

Fotorealistyczna kuchnia premium.

BARDZO WAŻNE:

- zachowaj realizm,
- poprawne proporcje,
- poprawne głębokości szafek,
- realistyczne narożniki,
- brak pustych przestrzeni,
- logiczna zabudowa,
- kuchnia ma wyglądać jak realny projekt stolarski,
- cinematic lighting,
- ultra realistic,
- photorealistic,
- luxury kitchen.

Jeśli klient chce poprawki:
- zmień tylko wskazane elementy,
- zachowaj resztę projektu.

ROZMOWA:

${conversation}

OSTATNIA WIADOMOŚĆ:

${message}

`;

      const image =
        await openai.images.generate({

          model:
            "gpt-image-1",

          prompt:
            imagePrompt,

          size:
            "1024x1536",
        });

      const rawImage =
        image.data?.[0]
          ?.b64_json;

      if (rawImage) {

        generatedImage =
          await addLogoToImage(
            rawImage
          );
      }

    } catch (imageError) {

      console.log(
        "IMAGE ERROR:",
        imageError
      );
    }

    const estimate =
      calculateFurnitureEstimate(
        aiReply
      );

    const finalReply = `

${aiReply}

---

# SZACUNKOWA WYCENA

NETTO:
${estimate.netto} zł

BRUTTO:
${estimate.brutto} zł

AGD wyceniane osobno.

Możesz dalej:
- poprawiać projekt,
- zmieniać materiały,
- zmieniać kolory,
- edytować układ,
- poprawiać wizualizację.

`;

    return Response.json({

      success: true,

      reply:
        finalReply,

      generatedImage,
    });

  } catch (err: any) {

    console.log(
      "CHAT API ERROR:",
      err
    );

    return Response.json({

      success: false,

      error:
        err?.message ||
        "Błąd AI",
    });
  }
}