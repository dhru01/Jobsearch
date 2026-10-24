import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { getAuth } from "@/lib/auth";

export default function HomePage() {
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <section className="flex min-h-dvh flex-col px-5 py-8 sm:px-10 sm:py-12">
        <Logo />
        <div className="flex flex-1 flex-col justify-center py-12">
          <p className="text-sm font-medium text-accent">South African graduate roles</p>
          <h1 className="mt-3 max-w-xl text-5xl leading-[0.95] text-ink sm:text-6xl">
            A shortlist with the working shown.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted">
            Confirm the facts on your profile, then see which synthetic vacancies fit. Fieldwork ranks the
            roles and tells you why. It prepares applications; it does not auto-submit to PNet, LinkedIn, or Indeed.
          </p>
          <Suspense fallback={<HomeLinks signedIn={false} />}>
            <HomeCta />
          </Suspense>
          <SampleListing className="mt-10 lg:hidden" />
        </div>
      </section>
      <aside className="hidden min-h-dvh items-center bg-ink px-8 py-12 text-bg lg:flex">
        <SampleListing />
      </aside>
    </main>
  );
}

function SampleListing({ className = "" }: { className?: string }) {
  return (
    <article className={`w-full rounded-[1.75rem] bg-raised p-6 text-ink shadow-[0_24px_60px_rgba(28,22,18,0.18)] ${className}`}>
      <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Sample listing</p>
      <h2 className="mt-3 text-3xl leading-none">Graduate Software Developer</h2>
      <p className="mt-2 text-sm text-muted">Harbour Ledger · Cape Town · Hybrid</p>
      <p className="mt-6 font-display text-6xl leading-none text-accent">92.5</p>
      <p className="mt-3 text-sm leading-6 text-muted">
        Eligible. Qualifications, skills, and Cape Town line up with the posting.
      </p>
    </article>
  );
}

async function HomeCta() {
  const { user } = await getAuth();
  return <HomeLinks signedIn={Boolean(user)} />;
}

function HomeLinks({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {signedIn ? (
        <Link href="/dashboard" className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white">
          Open your shortlist
        </Link>
      ) : (
        <>
          <Link href="/signup" className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white">
            Create account
          </Link>
          <Link href="/login" className="rounded-full border border-line bg-raised px-5 py-2.5 text-sm font-medium text-ink">
            Sign in
          </Link>
          <Link href="/privacy" className="rounded-full px-5 py-2.5 text-sm text-muted underline-offset-4 hover:underline">
            Privacy
          </Link>
        </>
      )}
    </div>
  );
}
