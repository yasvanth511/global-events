import { describe, it, expect } from "vitest";
import { classifyOrg } from "./orgType";

const ev = (eventOrgSchool: string | null, eventName = "Some Event") => ({ eventOrgSchool, eventName });

describe("classifyOrg", () => {
  it("classifies academic institutions from the org/school", () => {
    expect(classifyOrg(ev("Aquinas College"))).toBe("academic");
    expect(classifyOrg(ev("Grand Valley State University"))).toBe("academic");
    expect(classifyOrg(ev("Cleveland Institute of Music"))).toBe("academic");
    expect(classifyOrg(ev("Interlochen Arts Academy"))).toBe("academic");
    expect(classifyOrg(ev("Riverside High School"))).toBe("academic");
  });

  it("classifies clubs/orgs/community as community", () => {
    expect(classifyOrg(ev("Downtown Rotary Club"))).toBe("community");
    expect(classifyOrg(ev("Grand Rapids Community Foundation"))).toBe("community");
    expect(classifyOrg(ev("Tech Meetup Group"))).toBe("community");
  });

  it("falls back to the event name when the org is missing", () => {
    expect(classifyOrg(ev(null, "GVSU Campus Tour"))).toBe("academic");
    expect(classifyOrg(ev(null, "Neighborhood Cleanup Day"))).toBe("community");
  });
});
