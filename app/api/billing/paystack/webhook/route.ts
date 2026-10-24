import { verifyPaystackSignature } from "@/lib/billing/paystack";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  try {
    if (!verifyPaystackSignature(rawBody, signature)) {
      return Response.json({ error: "Invalid signature." }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "Paystack not configured." }, { status: 503 });
  }

  const event = JSON.parse(rawBody) as {
    event?: string;
    data?: {
      status?: string;
      metadata?: { user_id?: string; plan?: string };
      customer?: { customer_code?: string };
      subscription_code?: string;
    };
  };

  if (event.event !== "charge.success" || event.data?.status !== "success") {
    return Response.json({ received: true });
  }

  const userId = event.data?.metadata?.user_id;
  if (!userId) {
    return Response.json({ error: "Missing user metadata." }, { status: 400 });
  }

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      plan: "pro",
      status: "active",
      provider: "paystack",
      provider_customer_id: event.data.customer?.customer_code ?? null,
      provider_subscription_id: event.data.subscription_code ?? null,
      current_period_end: periodEnd.toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Subscription update failed", error.message);
    return Response.json({ error: "Update failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
