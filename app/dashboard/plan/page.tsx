import Link from "next/link";
import { Suspense } from "react";
import { devActivatePro, startProCheckout } from "@/lib/actions/billing";
import { LoadingBlock } from "@/components/loading-block";
import { PLANS } from "@/lib/billing/plans";
import { countTailoredGenerationsThisMonth } from "@/lib/billing/entitlements";
import { getUserSubscription, planDetails } from "@/lib/billing/subscription";
import { requireConfirmedProfile } from "@/lib/auth";

export const instant = false;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function PlanPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading plan" />}>
      <Plan searchParams={searchParams} />
    </Suspense>
  );
}

async function Plan({ searchParams }: PageProps) {
  const params = await searchParams;
  const { supabase, user } = await requireConfirmedProfile();
  const subscription = await getUserSubscription(supabase, user.id);
  const plan = planDetails(subscription.plan);
  const used = await countTailoredGenerationsThisMonth(supabase, user.id);
  const limit = plan.tailoredGenerationsPerMonth;

  const paid = params.paid === "1";
  const error =
    params.error === "paystack"
      ? "Paystack is not configured yet. Use dev upgrade locally or add PAYSTACK_SECRET_KEY."
      : params.error === "checkout"
        ? "Checkout could not be started. Try again."
        : params.error === "email"
          ? "Add an email to your account before upgrading."
          : null;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-accent">Plan</p>
        <h1 className="mt-2 text-4xl leading-none sm:text-5xl">{plan.label}</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
          Pro is R99/month for unlimited tailored documents and daily match digests. Fieldwork does not sell
          auto-apply.
        </p>
      </header>

      {paid ? (
        <p className="rounded-2xl bg-good-bg px-4 py-3 text-sm text-good">
          Payment received — if your plan does not update immediately, refresh in a minute.
        </p>
      ) : null}
      {error ? <p className="rounded-2xl bg-warn-bg px-4 py-3 text-sm text-warn">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <PlanCard
          title={PLANS.free.label}
          price="R0"
          active={subscription.plan === "free"}
          bullets={[
            `${PLANS.free.tailoredGenerationsPerMonth} tailored document sets per month`,
            "Job matches and assisted apply tracking",
            "No daily email digest",
          ]}
        />
        <PlanCard
          title={PLANS.pro.label}
          price="R99 / month"
          active={subscription.plan === "pro"}
          bullets={[
            "Unlimited tailored CV and cover letter sets",
            "Daily email digest of top eligible matches",
            "Same assisted apply — you still submit externally",
          ]}
        />
      </div>

      <div className="rounded-[1.5rem] border border-line bg-raised px-5 py-5 text-sm">
        <p className="text-muted">This month</p>
        <p className="mt-2 text-ink">
          Tailored document sets used:{" "}
          <strong>
            {used}
            {limit != null ? ` / ${limit}` : " (unlimited)"}
          </strong>
        </p>
        {subscription.currentPeriodEnd ? (
          <p className="mt-2 text-muted">
            Pro period ends {subscription.currentPeriodEnd.toLocaleDateString("en-ZA")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        {subscription.plan === "free" ? (
          <form action={startProCheckout}>
            <button type="submit" className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white">
              Upgrade with Paystack
            </button>
          </form>
        ) : (
          <span className="rounded-full bg-panel px-4 py-2 text-sm text-muted">You are on Pro</span>
        )}
        {process.env.BILLING_DEV_UPGRADE === "true" && subscription.plan === "free" ? (
          <form action={devActivatePro}>
            <button type="submit" className="rounded-full border border-line bg-bg px-4 py-2 text-sm">
              Dev: activate Pro
            </button>
          </form>
        ) : null}
        <Link href="/dashboard/profile" className="rounded-full border border-line bg-bg px-4 py-2 text-sm">
          Email preferences
        </Link>
      </div>
    </div>
  );
}

function PlanCard({
  title,
  price,
  active,
  bullets,
}: {
  title: string;
  price: string;
  active: boolean;
  bullets: string[];
}) {
  return (
    <div className={`rounded-[1.5rem] border px-5 py-5 ${active ? "border-accent bg-raised" : "border-line bg-bg"}`}>
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-2 font-display text-3xl">{price}</p>
      <ul className="mt-4 space-y-2 text-sm text-muted">
        {bullets.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}
