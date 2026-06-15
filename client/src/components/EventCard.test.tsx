import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EventCard from "./EventCard";
import type { EventRecord } from "../types";

function makeEvent(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    id: "evt-1",
    eventDate: "2026-06-12",
    eventTime: "2:00 PM",
    eventOrgSchool: "Aquinas College",
    eventName: "Information Session",
    eventUrl: "https://example.com",
    contactPerson: "Admissions",
    contactPhone: "(616) 632-2900",
    contactEmail: "info@example.com",
    address: "1700 Fulton St E",
    city: "Grand Rapids",
    state: "MI",
    country: "United States",
    startDate: "2026-06-12",
    ...overrides,
  };
}

describe("EventCard", () => {
  it("renders available fields with safe links", () => {
    render(<EventCard event={makeEvent()} />);

    expect(screen.getByRole("heading", { name: "Information Session" })).toBeInTheDocument();
    expect(screen.getByText(/2026-06-12 · 2:00 PM/)).toBeInTheDocument();
    expect(screen.getByText("Aquinas College")).toBeInTheDocument();
    expect(screen.getByText("Grand Rapids, MI, United States")).toBeInTheDocument();

    const eventLink = screen.getByRole("link", { name: "Event link" });
    expect(eventLink).toHaveAttribute("href", "https://example.com/");
    expect(eventLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(eventLink).toHaveAttribute("target", "_blank");

    expect(screen.getByRole("link", { name: "(616) 632-2900" })).toHaveAttribute("href", "tel:6166322900");
    expect(screen.getByRole("link", { name: "info@example.com" })).toHaveAttribute("href", "mailto:info@example.com");
  });

  it("omits unavailable fields and their labels", () => {
    render(
      <EventCard
        event={makeEvent({
          eventOrgSchool: null,
          eventUrl: null,
          contactPerson: null,
          contactPhone: null,
          contactEmail: null,
          address: null,
        })}
      />,
    );

    expect(screen.queryByText("Aquinas College")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Event link" })).not.toBeInTheDocument();
    expect(screen.queryByText("1700 Fulton St E")).not.toBeInTheDocument();
    // Location line falls back to just the place when address is absent.
    expect(screen.getByText("Grand Rapids, MI, United States")).toBeInTheDocument();
  });

  it("never renders unsafe (javascript:) URLs as links", () => {
    render(<EventCard event={makeEvent({ eventUrl: "javascript:alert(1)" })} />);
    expect(screen.queryByRole("link", { name: "Event link" })).not.toBeInTheDocument();
  });

  it("renders multiple semicolon-separated phone numbers", () => {
    render(<EventCard event={makeEvent({ contactPhone: "(616) 331-2025; (616) 331-5000" })} />);
    expect(screen.getByRole("link", { name: "(616) 331-2025" })).toHaveAttribute("href", "tel:6163312025");
    expect(screen.getByRole("link", { name: "(616) 331-5000" })).toHaveAttribute("href", "tel:6163315000");
  });
});
