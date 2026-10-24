import { Suspense } from "react";
import { connection } from "next/server";
import { DashboardNav } from "@/components/dashboard-nav";
import { LoadingBlock } from "@/components/loading-block";
import { requireConfirmedProfile } from "@/lib/auth";

export const instant = false;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingBlock label="Loading your workspace" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  await connection();
  const { profile } = await requireConfirmedProfile();

  return (
    <div className="min-h-full md:grid md:grid-cols-[230px_minmax(0,1fr)]">
      <DashboardNav name={profile.full_name} />
      <div className="min-w-0 px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
    </div>
  );
}
