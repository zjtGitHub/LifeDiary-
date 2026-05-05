export type ISODate = string;

export interface DiaryImage {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  createdAt: string;
}

export interface DayEntry {
  date: ISODate;
  text: string;
  tags: string[];
  images: DiaryImage[];
  updatedAt: string;
}

export interface TodoItem {
  id: string;
  date: ISODate;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: "me";
  birthDate?: ISODate;
}

export interface CalendarDayStatus {
  hasDiary: boolean;
  hasImages: boolean;
  todoCount: number;
  openTodoCount: number;
  tags: string[];
}

export interface SearchResult {
  date: ISODate;
  text: string;
  tags: string[];
  imageCount: number;
  todoCount: number;
  openTodoCount: number;
  updatedAt: string;
}

export interface WeekSummaryDay {
  date: ISODate;
  text: string;
  tags: string[];
  imageCount: number;
  todos: TodoItem[];
}

export interface WeekSummary {
  startDate: ISODate;
  endDate: ISODate;
  days: WeekSummaryDay[];
  diaryDays: number;
  imageCount: number;
  todoCount: number;
  openTodoCount: number;
}
