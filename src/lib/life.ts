import { addDays, addYears, differenceInCalendarDays, differenceInYears, format, isValid, parseISO } from "date-fns";
import type { ISODate } from "../types";

export interface LifeWeek {
  index: number;
  age: number;
  weekInYear: number;
  startDate: ISODate;
  endDate: ISODate;
  status: "past" | "current" | "future";
}

export interface LifeYearRow {
  age: number;
  weeks: LifeWeek[];
}

export interface LifeStats {
  birthDate: ISODate;
  totalWeeks: number;
  livedWeeks: number;
  currentWeek: number;
  currentAge: number;
  currentAgeWeek: number;
  rows: LifeYearRow[];
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const daysBetween = (start: Date, end: Date): number => differenceInCalendarDays(end, start);

export const isValidBirthDate = (value: string): value is ISODate => {
  const parsed = parseISO(value);
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
};

export const calculateLifeStats = (birthDate: ISODate, today = new Date()): LifeStats => {
  if (!isValidBirthDate(birthDate)) {
    throw new Error("Invalid birth date");
  }

  const birth = parseISO(birthDate);
  const hundredthBirthday = addYears(birth, 100);
  const totalWeeks = Math.ceil(daysBetween(birth, hundredthBirthday) / 7);
  const rawLivedWeeks = Math.floor(daysBetween(birth, today) / 7);
  const livedWeeks = clamp(rawLivedWeeks, 0, totalWeeks);
  const currentWeek = clamp(livedWeeks, 0, Math.max(totalWeeks - 1, 0));

  const rows: LifeYearRow[] = Array.from({ length: 100 }, (_, age) => ({ age, weeks: [] }));
  let currentAge = 0;
  let currentAgeWeek = 0;

  for (let index = 0; index < totalWeeks; index += 1) {
    const weekStart = addDays(birth, index * 7);
    const age = clamp(differenceInYears(weekStart, birth), 0, 99);
    const weekInYear = rows[age].weeks.length;
    const status = index === currentWeek ? "current" : index < livedWeeks ? "past" : "future";

    if (index === currentWeek) {
      currentAge = age;
      currentAgeWeek = weekInYear;
    }

    rows[age].weeks.push({
      index,
      age,
      weekInYear,
      startDate: format(weekStart, "yyyy-MM-dd"),
      endDate: format(addDays(weekStart, 6), "yyyy-MM-dd"),
      status
    });
  }

  return {
    birthDate,
    totalWeeks,
    livedWeeks,
    currentWeek,
    currentAge,
    currentAgeWeek,
    rows
  };
};
