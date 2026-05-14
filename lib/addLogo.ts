import sharp from "sharp";
import path from "path";

export async function addLogoToImage(
  base64Image: string
) {

  const imageBuffer =
    Buffer.from(
      base64Image,
      "base64"
    );

  const logoPath =
    path.join(
      process.cwd(),
      "public",
      "logo.png"
    );

  const logo =
    await sharp(logoPath)

      .resize(220)

      .png()

      .toBuffer();

  const finalImage =
    await sharp(imageBuffer)

      .composite([
        {
          input: logo,

          gravity:
            "southeast",

          top: 40,
          left: 40,
        },
      ])

      .png()

      .toBuffer();

  return finalImage.toString(
    "base64"
  );
}