"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/logo";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/matches", label: "Find jobs" },
  { href: "/dashboard/applications", label: "Applications" },
  { href: "/dashboard/auto-apply", label: "Auto-apply" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/plan", label: "Plan" },
];

export function DashboardNav({ name }: { name: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col gap-6 bg-ink px-4 py-5 text-bg md:sticky md:top-0 md:h-dvh md:px-5 md:py-8">
      <div className="flex items-center justify-between gap-3 md:block">
        <Logo tone="paper" />
        {name ? <p className="text-sm text-bg/75 md:mt-4">{name}</p> : null}
      </div>
      <nav className="flex gap-2 overflow-x-auto md:flex-col">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-2 text-sm whitespace-nowrap ${
                active ? "bg-bg font-medium text-ink" : "text-bg/70 hover:bg-white/10 hover:text-bg"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <form action={signOut} className="md:mt-auto">
        <button type="submit" className="text-sm text-bg/70 underline-offset-4 hover:text-bg hover:underline">
          Sign out
        </button>
      </form>
    </aside>
  );
}
