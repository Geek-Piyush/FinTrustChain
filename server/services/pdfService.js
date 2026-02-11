import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs/promises";
import path from "path";

export async function createContractPDF(data, filename) {
  const templatePath = path.resolve("./public/templates/FinTrustChain.pdf");
  const templateBytes = await fs.readFile(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  pdfDoc.registerFontkit(fontkit);
  const fontPath = path.resolve("./public/fonts/NotoSans-Regular.ttf");
  const fontBytes = await fs.readFile(fontPath);
  const customFont = await pdfDoc.embedFont(fontBytes);
  const fontColor = rgb(0, 0, 0);

  const pagesData = [
    { page: pdfDoc.getPage(0), role: "receiver" },
    { page: pdfDoc.getPage(1), role: "guarantor" },
    { page: pdfDoc.getPage(2), role: "lender" },
  ];

  for (const { page, role } of pagesData) {
    // --- COORDINATE ADJUSTMENTS ---

    page.drawText(data.dateISO, {
      x: 560,
      y: 2220,
      font: customFont,
      size: 44,
      color: fontColor,
    });
    page.drawText(data.receiver.name, {
      x: 560,
      y: 2150,
      font: customFont,
      size: 44,
      color: fontColor,
    });
    page.drawText(data.lender.name, {
      x: 560,
      y: 2075,
      font: customFont,
      size: 44,
      color: fontColor,
    });
    page.drawText(data.guarantor.name, {
      x: 560,
      y: 2005,
      font: customFont,
      size: 44,
      color: fontColor,
    });

    page.drawText(`I, ${data[role].name},`, {
      x: 156,
      y: 820,
      font: customFont,
      size: 46,
      color: fontColor,
    });

    const tableX = 1210;
    const fontS = 50;
    page.drawText(data.contractId, {
      x: tableX,
      y: 1715,
      font: customFont,
      size: fontS,
      color: fontColor,
    });
    page.drawText(data.loanAmountDisplay, {
      x: tableX,
      y: 1595,
      font: customFont,
      size: fontS,
      color: fontColor,
    });
    page.drawText(data.interestRateDisplay, {
      x: tableX,
      y: 1475,
      font: customFont,
      size: fontS,
      color: fontColor,
    });
    page.drawText(data.repaymentPeriodDisplay, {
      x: tableX,
      y: 1355,
      font: customFont,
      size: fontS,
      color: fontColor,
    });
    page.drawText(data.startDateDisplay, {
      x: tableX,
      y: 1235,
      font: customFont,
      size: fontS,
      color: fontColor,
    });
    page.drawText(data.endDateDisplay, {
      x: tableX,
      y: 1115,
      font: customFont,
      size: fontS,
      color: fontColor,
    });
    page.drawText(String(data[role].tiAtSigning), {
      x: tableX,
      y: 995,
      font: customFont,
      size: fontS,
      color: fontColor,
    });

    page.drawText(data[role].name, {
      x: 1435,
      y: 165,
      font: customFont,
      size: 60,
      color: fontColor,
    });
  }

  const pdfBytes = await pdfDoc.save();
  const outputPath = path.resolve(`./public/contracts/${filename}`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, pdfBytes);

  return filename;
}

export async function applySignatureToPDF(contractFilename, user, role) {
  const contractPath = path.resolve(`./public/contracts/${contractFilename}`);
  const contractBytes = await fs.readFile(contractPath);
  const pdfDoc = await PDFDocument.load(contractBytes);

  const signaturePath = path.resolve(
    `./public/img/esigns/${user.eSign.filename}`
  );
  const signatureBytes = await fs.readFile(signaturePath);
  const signatureImage = await pdfDoc.embedPng(signatureBytes);

  // Adjusted signature coordinates and size
  const signatureCoords = {
    receiver: { pageIndex: 0, x: 1383, y: 240, width: 500, height: 200 },
    guarantor: { pageIndex: 1, x: 1383, y: 240, width: 500, height: 200 },
    lender: { pageIndex: 2, x: 1383, y: 240, width: 500, height: 200 },
  };

  const { pageIndex, ...coords } = signatureCoords[role];
  if (pageIndex === undefined) {
    throw new Error(`Invalid role provided for signature: ${role}`);
  }
  const page = pdfDoc.getPage(pageIndex);
  page.drawImage(signatureImage, coords);

  const pdfBytesUpdated = await pdfDoc.save();
  await fs.writeFile(contractPath, pdfBytesUpdated);
  return contractFilename;
}

/**
 * Creates a Closure Agreement PDF from the template and overwrites the existing contract PDF.
 * Pages 0-2 are filled identically to the original contract.
 * Page 3 (closure page) gets only: date, receiver name, lender name, guarantor name.
 */
export async function createClosurePDF(data, filename) {
  const templatePath = path.resolve(
    "./public/templates/Closure_Agreement.pdf"
  );
  const templateBytes = await fs.readFile(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  pdfDoc.registerFontkit(fontkit);
  const fontPath = path.resolve("./public/fonts/NotoSans-Regular.ttf");
  const fontBytes = await fs.readFile(fontPath);
  const customFont = await pdfDoc.embedFont(fontBytes);
  const fontColor = rgb(0, 0, 0);

  // --- Pages 0-2: Fill exactly like the contract PDF ---
  const pagesData = [
    { page: pdfDoc.getPage(0), role: "receiver" },
    { page: pdfDoc.getPage(1), role: "guarantor" },
    { page: pdfDoc.getPage(2), role: "lender" },
  ];

  for (const { page, role } of pagesData) {
    page.drawText(data.dateISO, {
      x: 560,
      y: 2220,
      font: customFont,
      size: 44,
      color: fontColor,
    });
    page.drawText(data.receiver.name, {
      x: 560,
      y: 2150,
      font: customFont,
      size: 44,
      color: fontColor,
    });
    page.drawText(data.lender.name, {
      x: 560,
      y: 2075,
      font: customFont,
      size: 44,
      color: fontColor,
    });
    page.drawText(data.guarantor.name, {
      x: 560,
      y: 2005,
      font: customFont,
      size: 44,
      color: fontColor,
    });

    page.drawText(`I, ${data[role].name},`, {
      x: 156,
      y: 820,
      font: customFont,
      size: 46,
      color: fontColor,
    });

    const tableX = 1210;
    const fontS = 50;
    page.drawText(data.contractId, {
      x: tableX,
      y: 1715,
      font: customFont,
      size: fontS,
      color: fontColor,
    });
    page.drawText(data.loanAmountDisplay, {
      x: tableX,
      y: 1595,
      font: customFont,
      size: fontS,
      color: fontColor,
    });
    page.drawText(data.interestRateDisplay, {
      x: tableX,
      y: 1475,
      font: customFont,
      size: fontS,
      color: fontColor,
    });
    page.drawText(data.repaymentPeriodDisplay, {
      x: tableX,
      y: 1355,
      font: customFont,
      size: fontS,
      color: fontColor,
    });
    page.drawText(data.startDateDisplay, {
      x: tableX,
      y: 1235,
      font: customFont,
      size: fontS,
      color: fontColor,
    });
    page.drawText(data.endDateDisplay, {
      x: tableX,
      y: 1115,
      font: customFont,
      size: fontS,
      color: fontColor,
    });
    page.drawText(String(data[role].tiAtSigning), {
      x: tableX,
      y: 995,
      font: customFont,
      size: fontS,
      color: fontColor,
    });

    page.drawText(data[role].name, {
      x: 1435,
      y: 165,
      font: customFont,
      size: 60,
      color: fontColor,
    });
  }

  // --- Page 3: Closure-specific page (only date + names) ---
  const closurePage = pdfDoc.getPage(3);

  closurePage.drawText(data.dateISO, {
    x: 560,
    y: 2220,
    font: customFont,
    size: 44,
    color: fontColor,
  });
  closurePage.drawText(data.receiver.name, {
    x: 560,
    y: 2150,
    font: customFont,
    size: 44,
    color: fontColor,
  });
  closurePage.drawText(data.lender.name, {
    x: 560,
    y: 2075,
    font: customFont,
    size: 44,
    color: fontColor,
  });
  closurePage.drawText(data.guarantor.name, {
    x: 560,
    y: 2005,
    font: customFont,
    size: 44,
    color: fontColor,
  });

  // Save — overwrite the existing contract PDF
  const pdfBytes = await pdfDoc.save();
  const outputPath = path.resolve(`./public/contracts/${filename}`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, pdfBytes);

  console.log(`Closure Agreement PDF saved as: ${filename}`);
  return filename;
}
