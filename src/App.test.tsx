import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { db, saveBirthDate, saveDayText } from "./lib/db";

describe("App", () => {
  beforeEach(async () => {
    vi.setSystemTime(new Date("2026-05-05T08:00:00"));
    await db.delete();
    await db.open();
  });

  it("loads saved diary text and switches when a calendar day is clicked", async () => {
    await saveDayText("2026-05-06", "五月六日的日记");

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /2026-05-06/ }));

    await waitFor(() => expect(screen.getByLabelText("日记正文")).toHaveValue("五月六日的日记"));
  });

  it("autosaves diary text", async () => {
    render(<App />);

    const textarea = await screen.findByLabelText("日记正文");
    fireEvent.change(textarea, { target: { value: "自动保存内容" } });

    await waitFor(
      async () => {
        expect((await db.dayEntries.get("2026-05-05"))?.text).toBe("自动保存内容");
      },
      { timeout: 1200 }
    );
  });

  it("adds and removes image previews", async () => {
    render(<App />);

    const input = screen.getByLabelText("添加图片");
    const file = new File(["image"], "photo.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByAltText("photo.png")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "删除图片：photo.png" }));
    await waitFor(() => expect(screen.queryByAltText("photo.png")).not.toBeInTheDocument());
  });

  it("jumps the calendar and diary date when a life week is clicked", async () => {
    await saveBirthDate("2000-01-01");
    await saveDayText("2000-01-15", "这一周开始的日记");

    render(<App />);

    fireEvent.click(await screen.findByRole("button", { name: /0 岁第 3 周，2000-01-15/ }));

    await waitFor(() => expect(screen.getByText("2000年1月")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByLabelText("日记正文")).toHaveValue("这一周开始的日记"));
  });
});
