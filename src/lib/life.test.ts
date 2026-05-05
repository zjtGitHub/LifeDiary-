import { describe, expect, it } from "vitest";
import { calculateLifeStats, isValidBirthDate } from "./life";

describe("life week calculations", () => {
  it("validates strict date input", () => {
    expect(isValidBirthDate("2000-02-29")).toBe(true);
    expect(isValidBirthDate("2000-2-29")).toBe(false);
    expect(isValidBirthDate("not-a-date")).toBe(false);
  });

  it("calculates total and lived weeks for a normal birthday", () => {
    const stats = calculateLifeStats("2000-01-01", new Date("2000-01-15T00:00:00"));

    expect(stats.totalWeeks).toBe(5218);
    expect(stats.livedWeeks).toBe(2);
    expect(stats.currentWeek).toBe(2);
    expect(stats.currentAge).toBe(0);
    expect(stats.currentAgeWeek).toBe(2);
    expect(stats.rows).toHaveLength(100);
  });

  it("places the current week in the correct age row after a birthday", () => {
    const stats = calculateLifeStats("1995-04-08", new Date("2026-05-05T00:00:00"));
    const currentCell = stats.rows.flatMap((row) => row.weeks).find((week) => week.status === "current");

    expect(stats.currentAge).toBe(31);
    expect(stats.currentAgeWeek).toBe(3);
    expect(currentCell?.age).toBe(31);
    expect(currentCell?.weekInYear).toBe(3);
    expect(currentCell?.startDate).toBe("2026-05-02");
    expect(currentCell?.endDate).toBe("2026-05-08");
  });

  it("handles leap day birthdays", () => {
    const stats = calculateLifeStats("2000-02-29", new Date("2001-02-28T00:00:00"));

    expect(stats.livedWeeks).toBe(52);
    expect(stats.totalWeeks).toBe(5218);
  });

  it("clamps dates before birth and after 100 years", () => {
    expect(calculateLifeStats("2030-01-01", new Date("2029-01-01T00:00:00")).livedWeeks).toBe(0);

    const overHundred = calculateLifeStats("1900-01-01", new Date("2005-01-01T00:00:00"));
    expect(overHundred.livedWeeks).toBe(overHundred.totalWeeks);
  });
});
