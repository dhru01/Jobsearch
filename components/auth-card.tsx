import { Logo } from "@/components/logo";

export function AuthCard({
  title,
  lede,
  children,
  width = "max-w-lg",
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="flex flex-col bg-ink px-6 py-8 text-bg lg:sticky lg:top-0 lg:h-dvh lg:px-8">
        <Logo href="/" tone="paper" />
        <div className="mt-8 lg:mt-0 lg:flex lg:flex-1 lg:flex-col lg:justify-center">
          <h1 className="text-4xl leading-[0.95] lg:text-5xl">{title}</h1>
          <p className="mt-4 max-w-xs text-sm leading-6 text-bg/75">{lede}</p>
        </div>
      </aside>
      <section className="px-5 py-10 sm:px-12 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center">
        <div className={width}>{children}</div>
      </section>
    </main>
  );
}
