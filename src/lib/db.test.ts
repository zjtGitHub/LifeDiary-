import { beforeEach, describe, expect, it } from "vitest";
import {
  addImagesToDay,
  addTodo,
  createBackupPayload,
  db,
  deleteImageFromDay,
  deleteTodo,
  getDayEntry,
  getWeekSummary,
  listAllTags,
  listCalendarStatuses,
  listTodosByDate,
  restoreBackupPayload,
  saveBirthDate,
  saveDayTags,
  saveDayText,
  searchEntries,
  setTodoCompleted
} from "./db";

describe("IndexedDB data layer", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("saves and loads diary text and images", async () => {
    await saveDayText("2026-05-05", "今天开始写日记。");
    const file = new File(["image"], "day.png", { type: "image/png" });
    const entryWithImage = await addImagesToDay("2026-05-05", [file]);

    expect(entryWithImage.images).toHaveLength(1);
    expect((await getDayEntry("2026-05-05")).text).toBe("今天开始写日记。");

    await deleteImageFromDay("2026-05-05", entryWithImage.images[0].id);
    expect((await getDayEntry("2026-05-05")).images).toHaveLength(0);
  });

  it("manages todos by date", async () => {
    const todo = await addTodo("2026-05-05", "写计划");
    await addTodo("2026-05-06", "另一天");

    expect(await listTodosByDate("2026-05-05")).toHaveLength(1);

    await setTodoCompleted(todo.id, true);
    expect((await listTodosByDate("2026-05-05"))[0].completed).toBe(true);

    await deleteTodo(todo.id);
    expect(await listTodosByDate("2026-05-05")).toHaveLength(0);
  });

  it("saves profile birth date", async () => {
    const profile = await saveBirthDate("2000-01-01");
    expect(profile.birthDate).toBe("2000-01-01");
  });

  it("tracks tags, calendar statuses, and search results", async () => {
    await saveDayText("2026-05-05", "今天去了海边。");
    await saveDayTags("2026-05-05", ["旅行", "旅行", "照片"]);
    await addTodo("2026-05-05", "整理照片");

    const statuses = await listCalendarStatuses();
    expect(statuses["2026-05-05"].hasDiary).toBe(true);
    expect(statuses["2026-05-05"].openTodoCount).toBe(1);
    expect(await listAllTags()).toEqual(["旅行", "照片"]);
    expect((await searchEntries("海边"))[0].date).toBe("2026-05-05");
    expect((await searchEntries("#旅行"))[0].tags).toContain("旅行");
  });

  it("summarizes a selected life week", async () => {
    await saveDayText("2026-05-05", "周二记录");
    await addTodo("2026-05-06", "周三计划");

    const summary = await getWeekSummary("2026-05-04", "2026-05-10");

    expect(summary.days).toHaveLength(7);
    expect(summary.diaryDays).toBe(1);
    expect(summary.todoCount).toBe(1);
    expect(summary.days.find((day) => day.date === "2026-05-05")?.text).toBe("周二记录");
  });

  it("exports and restores text backup data", async () => {
    await saveBirthDate("2000-01-01");
    await saveDayText("2026-05-05", "备份内容");
    await saveDayTags("2026-05-05", ["备份"]);
    await addTodo("2026-05-05", "备份计划");

    const payload = await createBackupPayload();
    await db.dayEntries.clear();
    await db.todos.clear();
    await db.profile.clear();
    await restoreBackupPayload(payload);

    expect((await getDayEntry("2026-05-05")).text).toBe("备份内容");
    expect((await getDayEntry("2026-05-05")).tags).toEqual(["备份"]);
    expect(await listTodosByDate("2026-05-05")).toHaveLength(1);
  });
});
