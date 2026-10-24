export async function openProfileDocument(
  documentId: string,
  mode: "preview" | "download",
): Promise<{ error: string | null }> {
  const disposition = mode === "download" ? "attachment" : "inline";
  const response = await fetch(`/dashboard/documents/${documentId}/file?disposition=${disposition}`);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    return { error: payload?.error ?? "Could not open this file." };
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  if (mode === "download") {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "";
    anchor.rel = "noopener noreferrer";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    return { error: null };
  }
  const opened = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!opened) {
    URL.revokeObjectURL(objectUrl);
    return { error: "Allow pop-ups to preview, or use Download." };
  }
  return { error: null };
}
