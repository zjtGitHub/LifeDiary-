import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import type { ISODate } from "../types";

export const isoDate = (date: Date): ISODate => format(date, "yyyy-MM-dd");

export const parseISODate = (date: ISODate): Date => parseISO(date);

export const displayDate = (date: ISODate): string => format(parseISODate(date), "yyyy年M月d日");

export const displayMonth = (date: Date): string => format(date, "yyyy年M月");

export const previousMonth = (date: Date): Date => subMonths(date, 1);

export const nextMonth = (date: Date): Date => addMonths(date, 1);

export interface CalendarDay {
  date: Date;
  iso: ISODate;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export const buildMonthGrid = (monthDate: Date, today = new Date()): CalendarDay[] => {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((date) => ({
    date,
    iso: isoDate(date),
    isCurrentMonth: isSameMonth(date, monthDate),
    isToday: isSameDay(date, today)
  }));
};
