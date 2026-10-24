import { applicationEventLabel } from "@/lib/labels";

type EventRow = {
  id: string;
  event_type: string;
  created_at: string;
};

export function ApplicationTimeline({ events }: { events: EventRow[] }) {
  if (events.length === 0) return null;

  return (
    <section className="rounded-[1.75rem] border border-line bg-raised p-5 sm:p-6">
      <h2 className="text-lg">Activity</h2>
      <ul className="mt-4 space-y-3">
        {events.map((event) => (
          <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span>{applicationEventLabel(event.event_type)}</span>
            <time className="text-muted" dateTime={event.created_at}>
              {new Date(event.created_at).toLocaleString("en-ZA", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </time>
          </li>
        ))}
      </ul>
    </section>
  );
}
