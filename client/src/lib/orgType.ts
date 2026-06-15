export type OrgType = "academic" | "professional" | "other";

/** Keywords that mark an organizer as an academic institution. */
const ACADEMIC_PATTERN =
  /\b(universit(?:y|ies)|college|institute|institution|polytechnic|academ(?:y|ies)|seminary|conservator(?:y|ies)|school|campus)\b/i;

/** Keywords that mark an organizer as a professional body, association, or company. */
const PROFESSIONAL_PATTERN =
  /\b(association|society|federation|chamber|guild|consortium|professionals?|corporation|incorporated|inc|ll[cp]|ltd|compan(?:y|ies)|technolog(?:y|ies)|systems|solutions|laborator(?:y|ies)|labs)\b/i;

/**
 * Classify an event's organizer. There is no category column, so this is derived
 * from free text: Event Org/School when present, otherwise the event name.
 * Academic is checked first, then professional; anything else is "other"
 * (only the academic and professional buckets are exposed as filter options).
 */
export function classifyOrg(event: { eventOrgSchool: string | null; eventName: string }): OrgType {
  const basis = event.eventOrgSchool ?? event.eventName;
  if (ACADEMIC_PATTERN.test(basis)) return "academic";
  if (PROFESSIONAL_PATTERN.test(basis)) return "professional";
  return "other";
}

/** Selectable organizer-type filter options (excludes the internal "other"). */
export const ORG_TYPE_OPTIONS: { value: Exclude<OrgType, "other">; label: string }[] = [
  { value: "academic", label: "Academic" },
  { value: "professional", label: "Professional" },
];
