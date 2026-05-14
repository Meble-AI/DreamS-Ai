import ExcelJS from "exceljs";
import path from "path";

const winax = require("winax");

export async function generateEstimate(
  kitchenData: any
) {

  const sourceFile =
    path.join(
      process.cwd(),
      "NOWA WYCENA MEBLI.xlsx"
    );

  const outputFile =
    path.join(
      process.cwd(),
      "temp-estimate.xlsx"
    );

  // =========================
  // LOAD EXCEL
  // =========================

  const workbook =
    new ExcelJS.Workbook();

  await workbook.xlsx.readFile(
    sourceFile
  );

  const sheet =
    workbook.getWorksheet(
      "1. KALKULACJA"
    );

  if (!sheet) {

    throw new Error(
      "Brak arkusza 1. KALKULACJA"
    );
  }

  // =========================
  // CABINETS
  // =========================

  kitchenData.cabinets?.forEach(

    (
      cabinet: any,
      index: number
    ) => {

      const row =
        16 + index;

      sheet.getCell(`E${row}`).value =
        cabinet.corpus ||
        "LAMINAT BIAŁY";

      sheet.getCell(`G${row}`).value =
        cabinet.front ||
        "AKRYL";

      sheet.getCell(`I${row}`).value =
        cabinet.width || 600;

      sheet.getCell(`J${row}`).value =
        cabinet.height || 720;

      sheet.getCell(`K${row}`).value =
        cabinet.depth || 560;

      sheet.getCell(`L${row}`).value =
        cabinet.shelves || 0;

      sheet.getCell(`M${row}`).value =
        cabinet.quantity || 1;
    }
  );

  // =========================
  // BLENDY
  // =========================

  kitchenData.blends?.forEach(

    (
      item: any,
      index: number
    ) => {

      const row =
        80 + index;

      sheet.getCell(`G${row}`).value =
        item.material || "LAMINAT";

      sheet.getCell(`I${row}`).value =
        item.width || 0;

      sheet.getCell(`J${row}`).value =
        item.height || 0;

      sheet.getCell(`K${row}`).value =
        item.quantity || 1;
    }
  );

  // =========================
  // UCHWYTY
  // =========================

  kitchenData.handles?.forEach(

    (
      item: any,
      index: number
    ) => {

      const row =
        123 + index;

      sheet.getCell(`E${row}`).value =
        item.type || "";

      sheet.getCell(`I${row}`).value =
        item.quantity || 1;
    }
  );

  // =========================
  // ZAWIASY
  // =========================

  kitchenData.hinges?.forEach(

    (
      item: any,
      index: number
    ) => {

      const row =
        139 + index;

      sheet.getCell(`E${row}`).value =
        item.type || "";

      sheet.getCell(`I${row}`).value =
        item.quantity || 1;
    }
  );

  // =========================
  // PODNOŚNIKI
  // =========================

  kitchenData.lifts?.forEach(

    (
      item: any,
      index: number
    ) => {

      const row =
        155 + index;

      sheet.getCell(`E${row}`).value =
        item.type || "";

      sheet.getCell(`I${row}`).value =
        item.quantity || 1;
    }
  );

  // =========================
  // SZUFLADY
  // =========================

  kitchenData.drawers?.forEach(

    (
      item: any,
      index: number
    ) => {

      const row =
        172 + index;

      sheet.getCell(`E${row}`).value =
        item.type || "";

      sheet.getCell(`I${row}`).value =
        item.quantity || 1;
    }
  );

  // =========================
  // BLATY
  // =========================

  kitchenData.countertops?.forEach(

    (
      item: any,
      index: number
    ) => {

      const row =
        189 + index;

      sheet.getCell(`E${row}`).value =
        item.type || "";

      sheet.getCell(`I${row}`).value =
        item.length || 0;
    }
  );

  // =========================
  // AKCESORIA
  // =========================

  kitchenData.accessories?.forEach(

    (
      item: any,
      index: number
    ) => {

      const row =
        203 + index;

      sheet.getCell(`E${row}`).value =
        item.type || "";
    }
  );

  // =========================
  // TRANSPORT
  // =========================

  sheet.getCell("E267").value =
    kitchenData.transportKm || 0;

  // =========================
  // VAT
  // =========================

  sheet.getCell("G275").value =
    kitchenData.vat || "8%";

  // =========================
  // SAVE TEMP FILE
  // =========================

  await workbook.xlsx.writeFile(
    outputFile
  );

  // =========================
  // REAL EXCEL RECALC
  // =========================

  const excel =
    new winax.Object(
      "Excel.Application"
    );

  excel.Visible = false;

  const wb =
    excel.Workbooks.Open(
      outputFile
    );

  excel.CalculateFull();

  wb.Save();

  const ws =
    wb.Worksheets(
      "1. KALKULACJA"
    );

  const netto =
    ws.Range("H274").Value;

  const brutto =
    ws.Range("H276").Value;

  wb.Close(false);

  excel.Quit();

  return {

    netto:
      Number(netto || 0),

    brutto:
      Number(brutto || 0),
  };
}