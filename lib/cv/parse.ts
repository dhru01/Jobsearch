import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function detectCvType(fileName: string, mimeType: string) {
  const extension = fileName.toLowerCase().split(".").pop();
  if (mimeType === PDF || extension === "pdf") return "pdf" as const;
  if (mimeType === DOCX || extension === "docx") return "docx" as const;
  return null;
}

export async function extractCvText(fileName: string, mimeType: string, bytes: Uint8Array) {
  const kind = detectCvType(fileName, mimeType);
  if (!kind) {
    throw new Error("Upload a PDF or DOCX file.");
  }

  if (kind === "pdf") {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return text.trim();
  }

  const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return result.value.trim();
}
