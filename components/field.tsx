export const fieldClass =
  "mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none transition placeholder:text-muted/50 focus:border-accent disabled:cursor-not-allowed disabled:border-line/70 disabled:bg-panel disabled:text-muted disabled:opacity-65 disabled:shadow-none focus:disabled:border-line/70";

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm text-muted">
      {children}
    </label>
  );
}

export function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {children}
    </p>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-ink">{children}</p>
  );
}
