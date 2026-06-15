export type OrgType = "academic" | "community";

/** Keywords that mark an organizer as an academic institution. */
const ACADEMIC_PATTERN =
  /\b(universit(?:y|ies)|college|institute|institution|polytechnic|academ(?:y|ies)|seminary|conservator(?:y|ies)|school|campus)\b/i;

/**
 * Classify an event's organizer as an academic institution or a
 * club/org/community group. Derived from free text (there is no category column):
 * uses Event Org/School when present, otherwise falls back to the event name.
 * Anything without an academic signal is treated as community/other.
 */
export function classifyOrg(event: { eventOrgSchool: string | null; eventName: string }): OrgType {
  const basis = event.eventOrgSchool ?? event.eventName;
  return ACADEMIC_PATTERN.test(basis) ? "academic" : "community";
}

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  academic: "Academic (university / college)",
  community: "Clubs, orgs & community",
};
