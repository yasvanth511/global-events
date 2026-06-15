import { describe, it, expect } from "vitest";
import { classifyOrg } from "./orgType";

const ev = (eventOrgSchool: string | null, eventName = "Some Event") => ({ eventOrgSchool, eventName });

describe("classifyOrg", () => {
  it("classifies academic institutions", () => {
    expect(classifyOrg(ev("Aquinas College"))).toBe("academic");
    expect(classifyOrg(ev("Grand Valley State University"))).toBe("academic");
    expect(classifyOrg(ev("Cleveland Institute of Music"))).toBe("academic");
    expect(classifyOrg(ev("Riverside High School"))).toBe("academic");
  });

  it("classifies professional bodies and companies", () => {
    expect(classifyOrg(ev("Michigan Bar Association"))).toBe("professional");
    expect(classifyOrg(ev("Society of Women Engineers"))).toBe("professional");
    expect(classifyOrg(ev("Grand Rapids Chamber"))).toBe("professional");
    expect(classifyOrg(ev("Acme Technologies Inc"))).toBe("professional");
  });

  it("treats anything else as other", () => {
    expect(classifyOrg(ev("Downtown Chess Club"))).toBe("other");
    expect(classifyOrg(ev("Riverside Rotary Club"))).toBe("other");
    expect(classifyOrg(ev(null, "Neighborhood Cleanup Day"))).toBe("other");
  });

  it("falls back to the event name when the org is missing", () => {
    expect(classifyOrg(ev(null, "GVSU Campus Tour"))).toBe("academic");
    expect(classifyOrg(ev(null, "Regional Developers Association Summit"))).toBe("professional");
  });
});
