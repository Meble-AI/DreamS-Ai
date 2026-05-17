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

    // =========================
    // GENERATE PROJECT?
    // =========================

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
    // CONSULTATION MODE
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
- zadawać pytania jak prawdziwy projektant wnętrz,
- pomagać klientowi stworzyć idealną kuchnię.

BARDZO WAŻNE:

- słuchaj klienta,
- analizuj CAŁĄ rozmowę,
- nie ignoruj wcześniejszych ustaleń,
- jeśli klient zmienia zdanie — uwzględnij OSTATNIĄ wersję,
- nie generuj jeszcze projektu,
- nie generuj jeszcze wizualizacji,
- nie podawaj jeszcze wyceny.

Zadawaj maksymalnie 2 pytania naraz.

Pytaj o:
- styl,
- kolory,
- układ,
- sprzęty,
- wymiary,
- budżet,
- materiały,
- inspiracje,
- funkcjonalność,
- rodzaj oświetlenia,
- wysokość zabudowy,
- wyspę,
- ergonomię.

Masz zachowywać się jak ekskluzywny projektant kuchni premium.

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

CAŁA ROZMOWA:

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

Jesteś profesjonalnym projektantem kuchni premium DreamS AI.

Na podstawie całej rozmowy:

- przeanalizuj wymagania klienta,
- uwzględnij wszystkie ustalenia,
- uwzględnij poprawki klienta,
- zachowaj spójność projektu,
- NIE ignoruj wcześniejszych informacji.

Wygeneruj profesjonalny projekt kuchni premium.

Układ odpowiedzi:

# DreamS AI
## Projekt kuchni premium

1. Krótki opis projektu

2. Układ i zabudowa

3. Materiały

4. Kolorystyka

5. AGD
(Napisz:
AGD wyceniane osobno)

6. Oświetlenie

7. Ergonomia i funkcjonalność

8. Szczegółowa wycena
(TYLKO MEBLE)

9. Profesjonalne podsumowanie

Styl:
premium,
nowoczesny,
estetyczny,
luksusowy.

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

CAŁA ROZMOWA:

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
    // IMAGE GENERATION
    // =========================

    let generatedImage =
      null;

    try {

      const imagePrompt = `

Stwórz ultra realistyczną wizualizację kuchni premium
na podstawie rozmowy klienta.

BARDZO WAŻNE:

- wizualizacja MUSI być zgodna z opisem klienta,
- NIE ignoruj wymagań klienta,
- uwzględnij wszystkie ustalenia,
- uwzględnij poprawki klienta,
- jeśli klient zmienił zdanie — użyj OSTATNICH ustaleń,
- zachowaj profesjonalny poziom architektoniczny,
- nowoczesna fotografia wnętrz,
- photorealistic,
- cinematic lighting,
- realistic materials,
- luxury kitchen,
- premium interior design,
- architectural visualization,
- ultra realistic,
- realistic proportions,
- premium furniture,
- realistic textures.

CAŁA ROZMOWA KLIENTA:

${conversation}

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

Jeśli chcesz:
- zmienić układ,
- poprawić kolory,
- zmienić styl,
- dodać wyspę,
- zmienić materiały,
- poprawić oświetlenie,
- stworzyć nową wersję,

po prostu napisz co zmieniamy 🙂

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