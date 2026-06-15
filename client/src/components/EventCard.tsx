import type { EventRecord } from "../types";
import { getUrgency, URGENCY_STYLES } from "../lib/urgency";

/** Only allow http(s) links to be rendered as anchors (blocks javascript:, etc.). */
function safeHttpUrl(raw: string): string | null {
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (url.protocol === "http:" || url.protocol === "https:") return url.href;
    return null;
  } catch {
    return null;
  }
}

/** Strip a phone string to a dialable tel: target, keeping a leading +. */
function telHref(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

function splitMulti(value: string): string[] {
  return value
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function DateTimeLine({ event }: { event: EventRecord }) {
  const parts = [event.eventDate, event.eventTime].filter(Boolean);
  return (
    <p className="text-sm font-medium text-indigo-700">
      {parts.join(" · ")}
    </p>
  );
}

function Location({ event }: { event: EventRecord }) {
  const place = [event.city, event.state, event.country].filter(Boolean).join(", ");
  if (!event.address && !place) return null;
  return (
    <div className="text-sm text-slate-600">
      {event.address && <p>{event.address}</p>}
      {place && <p>{place}</p>}
    </div>
  );
}

export default function EventCard({ event }: { event: EventRecord }) {
  const url = event.eventUrl ? safeHttpUrl(event.eventUrl) : null;
  const phones = event.contactPhone ? splitMulti(event.contactPhone) : [];
  const emails = event.contactEmail ? splitMulti(event.contactEmail) : [];
  const hasContact = event.contactPerson || phones.length > 0 || emails.length > 0;

  // Background colour and a relative-time badge convey how soon the event is.
  const urgency = getUrgency(event.startDate);
  const styles = URGENCY_STYLES[urgency.level];

  return (
    <article
      className={`flex h-full flex-col gap-3 rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md ${styles.card}`}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold leading-snug text-slate-900">{event.eventName}</h2>
          {urgency.label && (
            <span
              className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${styles.badge}`}
            >
              {urgency.label}
            </span>
          )}
        </div>
        <DateTimeLine event={event} />
        {event.eventOrgSchool && (
          <p className="text-sm text-slate-700">{event.eventOrgSchool}</p>
        )}
      </div>

      <Location event={event} />

      {url && (
        <div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-indigo-600 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Event link
          </a>
        </div>
      )}

      {hasContact && (
        <div className="mt-auto space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
          {event.contactPerson && <p className="font-medium text-slate-700">{event.contactPerson}</p>}
          {phones.map((phone) => (
            <p key={phone}>
              <a
                href={telHref(phone)}
                className="text-indigo-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {phone}
              </a>
            </p>
          ))}
          {emails.map((email) => (
            <p key={email}>
              <a
                href={`mailto:${email}`}
                className="text-indigo-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {email}
              </a>
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
