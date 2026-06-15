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

export type EventsResponse = {
  events: EventRecord[];
  meta: {
    fileName: string;
    eventCount: number;
    updatedAt: string;
  };
};

export type StatusResponse = {
  hasActiveDataset: boolean;
  fileName: string | null;
  eventCount: number | null;
  updatedAt: string | null;
};

export type UploadResult = {
  ok: boolean;
  activated?: boolean;
  fileName?: string;
  headers?: string[];
  rowCount?: number;
  sampleRows?: (string | null)[][];
  updatedAt?: string;
  errors: string[];
};
