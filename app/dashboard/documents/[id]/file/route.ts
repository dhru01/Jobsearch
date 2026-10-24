import { NextResponse } from "next/server";
import { requireConfirmedProfile } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

function contentTypeFor(fileName: string, stored: string | null) {
  if (stored && stored !== "application/octet-stream") return stored;
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const dispositionParam = new URL(request.url).searchParams.get("disposition");
  const disposition = dispositionParam === "attachment" ? "attachment" : "inline";

  const { supabase, user } = await requireConfirmedProfile();

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, file_name, mime_type, storage_path, kind, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (docError || !doc?.storage_path) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
  if (doc.kind === "tailored_cv") {
    return NextResponse.json({ error: "Open tailored documents from the application page." }, { status: 400 });
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("cvs")
    .download(doc.storage_path as string);

  if (downloadError || !file) {
    console.error("Document download failed", downloadError?.message);
    return NextResponse.json(
      {
        error:
          "This file is not available in storage. Delete the entry and upload the file again from your device.",
      },
      { status: 404 },
    );
  }

  const fileName = String(doc.file_name).replace(/[^\w.\-()+\s]/g, "_") || "document";
  const contentType = contentTypeFor(fileName, doc.mime_type as string | null);
  const bytes = new Uint8Array(await file.arrayBuffer());

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
