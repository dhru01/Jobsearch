import "server-only";
import PDFDocument from "pdfkit";
import type { TailoredCv } from "@/lib/documents/tailored-types";

function collectPdfBuffer(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function writeHeading(doc: PDFKit.PDFDocument, text: string) {
  doc.fontSize(10).fillColor("#555555").text(text.toUpperCase(), { characterSpacing: 0.5 });
  doc.moveDown(0.35);
  doc.fillColor("#111111");
}

export async function renderTailoredCvPdf(cv: TailoredCv) {
  const doc = new PDFDocument({ size: "A4", margin: 54 });
  const bufferPromise = collectPdfBuffer(doc);

  doc.fontSize(22).fillColor("#111111").text(cv.full_name, { align: "left" });
  doc.moveDown(0.2);
  doc.fontSize(11).fillColor("#333333").text(cv.headline);
  doc.moveDown(0.5);
  const contact = [cv.email, cv.phone, cv.location].filter(Boolean).join(" · ");
  if (contact) doc.fontSize(10).fillColor("#555555").text(contact);
  doc.moveDown(1);

  if (cv.summary.trim()) {
    writeHeading(doc, "Summary");
    doc.fontSize(10).text(cv.summary.trim(), { lineGap: 3 });
    doc.moveDown(0.8);
  }

  if (cv.skills.length > 0) {
    writeHeading(doc, "Skills");
    doc.fontSize(10).text(cv.skills.join(" · "), { lineGap: 2 });
    doc.moveDown(0.8);
  }

  if (cv.experience.some((item) => item.title || item.organisation || item.summary)) {
    writeHeading(doc, "Experience");
    for (const item of cv.experience) {
      if (!item.title && !item.organisation && !item.summary) continue;
      const dates = [item.start, item.end].filter(Boolean).join(" – ");
      doc.fontSize(11).font("Helvetica-Bold").text([item.title, item.organisation].filter(Boolean).join(" · "));
      doc.font("Helvetica");
      if (dates) doc.fontSize(9).fillColor("#555555").text(dates);
      doc.fillColor("#111111");
      if (item.summary.trim()) {
        doc.moveDown(0.15);
        doc.fontSize(10).text(item.summary.trim(), { lineGap: 2 });
      }
      doc.moveDown(0.5);
    }
  }

  if (cv.education.some((item) => item.institution || item.qualification)) {
    writeHeading(doc, "Education");
    for (const item of cv.education) {
      const line = [item.qualification, item.field].filter(Boolean).join(", ");
      const org = [item.institution, item.end_year].filter(Boolean).join(" · ");
      if (line) doc.fontSize(10).text(line);
      if (org) doc.fontSize(9).fillColor("#555555").text(org);
      doc.fillColor("#111111").moveDown(0.35);
    }
    doc.moveDown(0.4);
  }

  if (cv.qualifications.some((item) => item.name)) {
    writeHeading(doc, "Qualifications");
    doc.fontSize(10).text(
      cv.qualifications.map((item) => [item.name, item.level].filter(Boolean).join(" — ")).join("\n"),
      { lineGap: 2 },
    );
  }

  doc.end();
  return bufferPromise;
}

export async function renderCoverLetterPdf(letter: string, cv: Pick<TailoredCv, "full_name" | "email" | "phone">) {
  const doc = new PDFDocument({ size: "A4", margin: 54 });
  const bufferPromise = collectPdfBuffer(doc);

  doc.fontSize(10).fillColor("#555555").text(cv.full_name);
  if (cv.email) doc.text(cv.email);
  if (cv.phone) doc.text(cv.phone);
  doc.moveDown(1.2);
  doc.fontSize(11).fillColor("#111111").text(letter.trim(), { lineGap: 4, align: "left" });

  doc.end();
  return bufferPromise;
}
