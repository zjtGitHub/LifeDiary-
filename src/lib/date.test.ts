import { describe, expect, it } from "vitest";
import { buildMonthGrid, isoDate, parseISODate } from "./date";

describe("date utilities", () => {
  it("formats and parses ISO dates", () => {
    const date = parseISODate("2026-05-05");
    expect(isoDate(date)).toBe("2026-05-05");
  });

  it("builds a Monday-starting month grid with selectable ISO dates", () => {
    const days = buildMonthGrid(new Date("2026-05-15T00:00:00"), new Date("2026-05-05T00:00:00"));

    expect(days[0].iso).toBe("2026-04-27");
    expect(days[days.length - 1].iso).toBe("2026-05-31");
    expect(days.find((day) => day.iso === "2026-05-05")?.isToday).toBe(true);
    expect(days.find((day) => day.iso === "2026-04-30")?.isCurrentMonth).toBe(false);
  });
});
