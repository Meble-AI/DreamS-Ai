"use client";

import jsPDF from "jspdf";

export async function generatePremiumPDF({

  project,

}: any) {

  const pdf =
    new jsPDF(
      "p",
      "mm",
      "a4"
    );

  // ====================================
  // COVER
  // ====================================

  pdf.setFillColor(
    5,
    5,
    5
  );

  pdf.rect(
    0,
    0,
    210,
    297,
    "F"
  );

  pdf.setTextColor(
    255,
    255,
    255
  );

  pdf.setFontSize(32);

  pdf.text(
    "DreamS AI",
    20,
    40
  );

  pdf.setFontSize(18);

  pdf.text(
    "Premium Kitchen Concept",
    20,
    55
  );

  pdf.setFontSize(12);

  pdf.setTextColor(
    180,
    180,
    180
  );

  pdf.text(
    "Projekt wygenerowany przez AI",
    20,
    70
  );

  // ====================================
  // CLIENT
  // ====================================

  pdf.setTextColor(
    255,
    255,
    255
  );

  pdf.setFontSize(16);

  pdf.text(
    "Dane klienta",
    20,
    100
  );

  pdf.setFontSize(12);

  pdf.text(
    `Klient: ${project?.name || "-"}`,
    20,
    115
  );

  pdf.text(
    `Miasto: ${project?.city || "-"}`,
    20,
    125
  );

  pdf.text(
    `Status: ${project?.status || "-"}`,
    20,
    135
  );

  // ====================================
  // DESCRIPTION
  // ====================================

  pdf.setFontSize(16);

  pdf.text(
    "Opis projektu",
    20,
    165
  );

  pdf.setFontSize(11);

  const split =
    pdf.splitTextToSize(

      project?.prompt ||

      "Projekt kuchni premium",

      170
    );

  pdf.text(
    split,
    20,
    180
  );

  // ====================================
  // IMAGE
  // ====================================

  if (
    project?.image_url
  ) {

    try {

      pdf.addPage();

      pdf.setFillColor(
        10,
        10,
        10
      );

      pdf.rect(
        0,
        0,
        210,
        297,
        "F"
      );

      pdf.setFontSize(24);

      pdf.setTextColor(
        255,
        255,
        255
      );

      pdf.text(
        "Wizualizacja",
        20,
        25
      );

      pdf.addImage(

        `data:image/png;base64,${project.image_url}`,

        "PNG",

        10,
        40,

        190,
        190
      );

    } catch (err) {

      console.log(err);
    }
  }

  // ====================================
  // FOOTER
  // ====================================

  pdf.setFontSize(10);

  pdf.setTextColor(
    120,
    120,
    120
  );

  pdf.text(
    "DreamS AI © Premium Interior Intelligence",
    20,
    285
  );

  pdf.save(
    `DreamS-AI-${project?.id || "project"}.pdf`
  );
}