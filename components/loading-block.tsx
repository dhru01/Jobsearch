export function LoadingBlock({ label }: { label: string }) {
  return (
    <p className="px-6 py-16 font-display text-2xl text-muted" role="status">
      {label}
    </p>
  );
}
