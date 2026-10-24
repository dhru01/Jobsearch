import "server-only";
import { createHmac } from "node:crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

export class PaystackNotConfiguredError extends Error {
  constructor() {
    super("Paystack is not configured. Set PAYSTACK_SECRET_KEY.");
    this.name = "PaystackNotConfiguredError";
  }
}

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new PaystackNotConfiguredError();
  return key;
}

export async function initializeProCheckout(input: { email: string; userId: string; callbackUrl: string }) {
  const amountKobo = 9900;
  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: amountKobo,
      currency: "ZAR",
      callback_url: input.callbackUrl,
      metadata: {
        user_id: input.userId,
        plan: "pro",
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Paystack initialize failed", response.status, body);
    throw new Error("Could not start checkout.");
  }

  const json = (await response.json()) as {
    status?: boolean;
    data?: { authorization_url?: string; reference?: string };
  };

  if (!json.status || !json.data?.authorization_url) {
    throw new Error("Could not start checkout.");
  }

  return {
    authorizationUrl: json.data.authorization_url,
    reference: json.data.reference ?? "",
  };
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const hash = createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  return hash === signature;
}
