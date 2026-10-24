export type ApplyWorkflow = "assisted" | "mock" | "greenhouse" | "unsupported";

export function detectApplyWorkflow(originalUrl: string, source?: string): ApplyWorkflow {
  const url = originalUrl.toLowerCase();
  if (url.includes("/apply/mock") || source === "mock") return "mock";
  if (url.includes("greenhouse.io") || url.includes("boards.greenhouse.io")) return "greenhouse";
  if (source === "pnet" || url.includes("pnet.co.za")) return "unsupported";
  if (url.includes("linkedin.com") || url.includes("indeed.com") || url.includes("za.indeed.com")) {
    return "unsupported";
  }
  return "assisted";
}

export function workflowCanAutoSubmit(workflow: ApplyWorkflow) {
  if (workflow === "mock") return true;
  if (workflow === "greenhouse") return process.env.APPLY_LIVE === "true";
  return false;
}
