import { NextResponse } from "next/server";
import { buildTailoredPdf, recordApplicationOpened } from "@/lib/actions/tailored-documents";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const kindParam = new URL(request.url).searchParams.get("kind");
  const kind = kindParam === "cover" ? "cover" : "cv";

  const result = await buildTailoredPdf(id, kind);
  if (!result) {
    return NextResponse.json({ error: "Documents not found." }, { status: 404 });
  }

  await recordApplicationOpened(id);

  return new NextResponse(new Uint8Array(result.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
