import { BookOpen, CalendarDays, Grid3X3, ListChecks } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BackupPanel } from "./components/BackupPanel";
import { Calendar } from "./components/Calendar";
import { DayPanel } from "./components/DayPanel";
import { LifeGrid } from "./components/LifeGrid";
import { SearchPanel } from "./components/SearchPanel";
import {
  addImagesToDay,
  addTodo,
  createBackupPayload,
  deleteImageFromDay,
  deleteTodo,
  emptyDayEntry,
  getDayEntry,
  getProfile,
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
} from "./lib/db";
import { isoDate, parseISODate } from "./lib/date";
import type { CalendarDayStatus, DayEntry, ISODate, Profile, SearchResult, TodoItem, WeekSummary } from "./types";

function App() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<ISODate>(() => isoDate(today));
  const [month, setMonth] = useState<Date>(() => today);
  const [entry, setEntry] = useState<DayEntry>(() => emptyDayEntry(isoDate(today)));
  const [text, setText] = useState("");
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [profile, setProfile] = useState<Profile>({ id: "me" });
  const [saveStatus, setSaveStatus] = useState("已加载");
  const [isLoadingDay, setIsLoadingDay] = useState(true);
  const [calendarStatuses, setCalendarStatuses] = useState<Record<ISODate, CalendarDayStatus>>({});
  const [allTags, setAllTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [backupStatus, setBackupStatus] = useState("导出或恢复本地数据");
  const [overviewVersion, setOverviewVersion] = useState(0);
  const [selectedWeekRange, setSelectedWeekRange] = useState<{ startDate: ISODate; endDate: ISODate } | null>(null);
  const [weekSummary, setWeekSummary] = useState<WeekSummary | null>(null);

  const refreshTodos = async (date = selectedDate) => {
    const nextTodos = await listTodosByDate(date);
    setTodos(nextTodos);
  };

  const refreshEntry = async (date = selectedDate) => {
    const nextEntry = await getDayEntry(date);
    setEntry(nextEntry);
    setText(nextEntry.text);
    setSaveStatus("已加载");
  };

  const refreshOverview = async () => {
    const [nextStatuses, nextTags] = await Promise.all([listCalendarStatuses(), listAllTags()]);
    setCalendarStatuses(nextStatuses);
    setAllTags(nextTags);
    setOverviewVersion((version) => version + 1);
  };

  useEffect(() => {
    let alive = true;

    const loadProfile = async () => {
      const nextProfile = await getProfile();
      if (alive) {
        setProfile(nextProfile);
      }
    };

    loadProfile();
    refreshOverview();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const loadSearchResults = async () => {
      const results = await searchEntries(searchQuery);
      if (alive) {
        setSearchResults(results);
      }
    };

    loadSearchResults();

    return () => {
      alive = false;
    };
  }, [overviewVersion, searchQuery]);

  useEffect(() => {
    let alive = true;

    const loadWeekSummary = async () => {
      if (!selectedWeekRange) {
        setWeekSummary(null);
        return;
      }

      const summary = await getWeekSummary(selectedWeekRange.startDate, selectedWeekRange.endDate);
      if (alive) {
        setWeekSummary(summary);
      }
    };

    loadWeekSummary();

    return () => {
      alive = false;
    };
  }, [overviewVersion, selectedWeekRange]);

  useEffect(() => {
    let alive = true;
    setIsLoadingDay(true);

    const loadDay = async () => {
      const [nextEntry, nextTodos] = await Promise.all([getDayEntry(selectedDate), listTodosByDate(selectedDate)]);
      if (alive) {
        setEntry(nextEntry);
        setText(nextEntry.text);
        setTodos(nextTodos);
        setSaveStatus("已加载");
        setIsLoadingDay(false);
      }
    };

    loadDay();

    return () => {
      alive = false;
    };
  }, [selectedDate]);

  useEffect(() => {
    if (isLoadingDay || text === entry.text) {
      return;
    }

    setSaveStatus("保存中...");
    const timeout = window.setTimeout(async () => {
      const saved = await saveDayText(selectedDate, text);
      setEntry(saved);
      setSaveStatus("已自动保存");
      await refreshOverview();
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [entry.text, isLoadingDay, selectedDate, text]);

  const applyDateSelection = (date: ISODate) => {
    setSelectedDate(date);
    setMonth(parseISODate(date));
  };

  const handleSelectDate = (date: ISODate) => {
    setSelectedWeekRange(null);
    applyDateSelection(date);
  };

  const handleSelectSummaryDate = (date: ISODate) => {
    applyDateSelection(date);
  };

  const handleSelectLifeWeek = (startDate: ISODate, endDate: ISODate) => {
    setSelectedWeekRange({ startDate, endDate });
    applyDateSelection(startDate);
  };

  const handleTagsChange = async (tags: string[]) => {
    const nextEntry = await saveDayTags(selectedDate, tags);
    setEntry(nextEntry);
    setSaveStatus("已保存标签");
    await refreshOverview();
  };

  const handleAddImages = async (files: File[]) => {
    const nextEntry = await addImagesToDay(selectedDate, files);
    setEntry(nextEntry);
    setSaveStatus("已保存图片");
    await refreshOverview();
  };

  const handleDeleteImage = async (imageId: string) => {
    const nextEntry = await deleteImageFromDay(selectedDate, imageId);
    setEntry(nextEntry);
    setSaveStatus("已删除图片");
    await refreshOverview();
  };

  const handleAddTodo = async (title: string) => {
    await addTodo(selectedDate, title);
    await refreshTodos();
    await refreshOverview();
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    await setTodoCompleted(id, completed);
    await refreshTodos();
    await refreshOverview();
  };

  const handleDeleteTodo = async (id: string) => {
    await deleteTodo(id);
    await refreshTodos();
    await refreshOverview();
  };

  const handleSaveBirthDate = async (birthDate: ISODate) => {
    const nextProfile = await saveBirthDate(birthDate);
    setProfile(nextProfile);
  };

  const handleExportBackup = async () => {
    setBackupStatus("正在导出...");
    try {
      const payload = await createBackupPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `riji-backup-${isoDate(new Date())}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setBackupStatus("备份已导出");
    } catch {
      setBackupStatus("导出失败");
    }
  };

  const handleImportBackup = async (file: File) => {
    if (!window.confirm("导入备份会覆盖当前浏览器里的日记、图片、计划和生日。确定继续吗？")) {
      return;
    }

    setBackupStatus("正在导入...");
    try {
      const payload = JSON.parse(await file.text());
      await restoreBackupPayload(payload);
      const nextProfile = await getProfile();
      setProfile(nextProfile);
      setSelectedWeekRange(null);
      await Promise.all([refreshEntry(selectedDate), refreshTodos(selectedDate), refreshOverview()]);
      setBackupStatus("备份已恢复");
    } catch {
      setBackupStatus("导入失败");
    }
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">本地日记</p>
          <h1>
            <BookOpen aria-hidden="true" size={28} />
            日记
          </h1>
        </div>
        <div className="header-pills" aria-label="功能概览">
          <span>
            <CalendarDays size={16} />
            日历
          </span>
          <span>
            <ListChecks size={16} />
            计划
          </span>
          <span>
            <Grid3X3 size={16} />
            人生表格
          </span>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <Calendar
            month={month}
            selectedDate={selectedDate}
            statuses={calendarStatuses}
            onMonthChange={setMonth}
            onSelectDate={handleSelectDate}
          />
          <SearchPanel
            query={searchQuery}
            results={searchResults}
            tags={allTags}
            onQueryChange={setSearchQuery}
            onSelectDate={handleSelectDate}
          />
          <BackupPanel status={backupStatus} onExport={handleExportBackup} onImport={handleImportBackup} />
        </aside>

        <DayPanel
          date={selectedDate}
          entry={entry}
          text={text}
          todos={todos}
          saveStatus={saveStatus}
          onTextChange={setText}
          onTagsChange={handleTagsChange}
          onAddImages={handleAddImages}
          onDeleteImage={handleDeleteImage}
          onAddTodo={handleAddTodo}
          onToggleTodo={handleToggleTodo}
          onDeleteTodo={handleDeleteTodo}
        />

        <LifeGrid
          birthDate={profile.birthDate}
          selectedDate={selectedDate}
          weekSummary={weekSummary}
          onSaveBirthDate={handleSaveBirthDate}
          onSelectDate={handleSelectSummaryDate}
          onSelectWeek={handleSelectLifeWeek}
        />
      </div>
    </main>
  );
}

export default App;
