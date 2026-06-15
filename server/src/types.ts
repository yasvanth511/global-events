export type EventRecord = {
  id: string;
  eventDate: string;
  eventTime: string | null;
  eventOrgSchool: string | null;
  eventName: string;
  eventUrl: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  startDate: string | null;
};

export type ParseResult = {
  ok: boolean;
  headers: string[];
  errors: string[];
  events: EventRecord[];
  /** First five data rows, each normalized to null, aligned to the 12 headers. */
  sampleRows: (string | null)[][];
};

export type ActiveMeta = {
  originalName: string;
  updatedAt: string;
  eventCount: number;
};
