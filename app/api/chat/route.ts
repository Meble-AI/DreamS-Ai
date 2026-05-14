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
${item.user}
${item.ai}
`
      ),

      message,
    ].join("\n");

    const lowerConversation =
      conversation.toLowerCase();

    const generateProject =

      lowerConversation.includes(
        "gotowe"
      )

      ||

      lowerConversation.includes(
        "akceptuję"
      )

      ||

      lowerConversation.includes(
        "akceptuje"
      )

      ||

      lowerConversation.includes(
        "stwórz projekt"
      )

      ||

      lowerConversation.includes(
        "zrób projekt"
      )

      ||

      history.length >= 6;

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

Jesteś doradcą DreamS AI.

Prowadzisz konsultację dotyczącą mebli kuchennych premium.

Twoje zadania:

- prowadzić rozmowę,
- zadawać pytania,
- zbierać informacje,
- NIE podawać jeszcze wyceny,
- NIE tworzyć jeszcze projektu,
- NIE tworzyć jeszcze wizualizacji.

Zadawaj maksymalnie 2 pytania naraz.

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

Historia:
${conversation}

`,
            },
          ],

          temperature: 0.7,
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
    // FINAL PROJECT
    // =========================

    const project =
      await openai.chat.completions.create({

        model:
          "gpt-4.1-mini",

        messages: [

          {
            role: "system",

            content: `

Jesteś projektantem DreamS AI.

Klient podał komplet informacji.

Wygeneruj profesjonalny projekt kuchni premium.

Układ odpowiedzi:

# DreamS AI
## Projekt kuchni premium

1. Krótki opis projektu

2. Lista zabudowy

3. Materiały

4. AGD
(Napisz:
AGD wyceniane osobno)

5. Ergonomia i funkcjonalność

6. Szczegółowa wycena
(TYLKO MEBLE)

7. Profesjonalne podsumowanie

Styl:
premium,
estetyczny,
nowoczesny.

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

Historia:
${conversation}

`,
          },
        ],

        temperature: 0.7,
      });

    const aiReply =
      project.choices[0]
        .message.content ||

      "Brak odpowiedzi AI";

    // =========================
    // IMAGE GENERATION
    // =========================

    let generatedImage =
      null;

    try {

      const imagePrompt = `

Fotorealistyczna nowoczesna kuchnia premium.

Styl luksusowy.
Ciemne drewno.
Akryl kaszmir mat.
Blaty spiek kwarcowy.
Nowoczesne LED.
Wyspa kuchenna.
Lodówka w zabudowie.
Piekarnik w słupku.
Minimalistyczny design.
Realistic interior design.
Ultra realistic.
Premium kitchen.

`;

      const image =
        await openai.images.generate({

          model:
            "gpt-image-1",

          prompt:
            imagePrompt,

          size:
            "1536x1024",
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

# SZACUNKOWA WYCENA MEBLI

NETTO:
${estimate.netto} zł

BRUTTO:
${estimate.brutto} zł

AGD wyceniane osobno.

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