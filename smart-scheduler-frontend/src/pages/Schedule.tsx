import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";

import api from "@/api/axios";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { addNotification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface PlannedTaskBlock {
  taskId: string;
  title: string;
  date: string;
  start: string;
  end: string;
  duration: number;
  priority: string;
  deadline: string;
  status: "scheduled" | "splitAcrossDays" | "atRisk";
}

type WeekdayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

interface ScheduleResponse {
  availability: {
    availableFrom: string;
    availableTo: string;
    breakStart: string;
    breakEnd: string;
    freeDays: WeekdayKey[];
  };
  totalBlocks: number;
  appliedWellbeingLevel?: number;
  effectiveWorkHours?: number | null;
  reservedRestMinutes?: number;
  wellbeingNote?: string;
  scheduleLightened?: boolean;
  plan: PlannedTaskBlock[];
}

interface ImportedCalendarEvent {
  _id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  source: string;
}

const weekDays: Array<{ key: WeekdayKey; label: string }> = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

const statusBadgeVariant = {
  scheduled: "secondary",
  splitAcrossDays: "outline",
  atRisk: "destructive",
} as const;

const scheduleRefreshKey = "scheduleLastUpdatedAt";

function getCalendarEndpoint(path: string): string {
  const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";

  if (apiBaseUrl.endsWith("/api")) {
    return `${apiBaseUrl.slice(0, -4)}${path}`;
  }

  return `${apiBaseUrl}${path}`;
}

function notifyScheduleChanged() {
  localStorage.setItem(scheduleRefreshKey, Date.now().toString());
}

function syncAtRiskNotifications(plan: PlannedTaskBlock[]) {
  const seenTaskIds = new Set<string>();

  for (const block of plan) {
    if (block.status !== "atRisk" || seenTaskIds.has(block.taskId)) {
      continue;
    }

    seenTaskIds.add(block.taskId);
    addNotification({
      title: "Task at risk",
      message: `"${block.title}" may miss its deadline of ${new Date(
        block.deadline
      ).toLocaleString()}.`,
      kind: "warning",
      dedupeKey: `at-risk-${block.taskId}-${block.deadline}`,
    });
  }
}

function Schedule() {
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [isDownloadingCalendar, setIsDownloadingCalendar] = useState(false);
  const [isImportingCalendar, setIsImportingCalendar] = useState(false);
  const [isClearingCalendar, setIsClearingCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [importedEvents, setImportedEvents] = useState<ImportedCalendarEvent[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [availableFrom, setAvailableFrom] = useState("09:00");
  const [availableTo, setAvailableTo] = useState("18:00");
  const [breakStart, setBreakStart] = useState("13:00");
  const [breakEnd, setBreakEnd] = useState("14:00");
  const [freeDays, setFreeDays] = useState<WeekdayKey[]>([]);

  async function fetchSchedule() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/schedule/plan");
      const data = response.data;

      setSchedule(data);
      syncAtRiskNotifications(data.plan ?? []);

      if (data.availability) {
        setAvailableFrom(data.availability.availableFrom);
        setAvailableTo(data.availability.availableTo);
        setBreakStart(data.availability.breakStart);
        setBreakEnd(data.availability.breakEnd);
        setFreeDays(data.availability.freeDays ?? []);
      }

      const firstPlannedDate = data.plan?.length ? parseISO(data.plan[0].date) : undefined;
      setSelectedDate(firstPlannedDate);
      setViewMonth(firstPlannedDate ?? new Date());
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }

  async function fetchImportedEvents() {
    try {
      const response = await api.get(getCalendarEndpoint("/calendar/events"));
      setImportedEvents(response.data.events || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to load imported calendar events"
      );
    }
  }

  async function handleReplan() {
    try {
      setError("");
      setSuccess("");
      setIsReplanning(true);

      const response = await api.get("/schedule/replan");
      const data = response.data;

      setSchedule(data);
      syncAtRiskNotifications(data.plan ?? []);
      const firstPlannedDate = data.plan?.length ? parseISO(data.plan[0].date) : undefined;
      setSelectedDate(firstPlannedDate);
      setViewMonth(firstPlannedDate ?? new Date());
      notifyScheduleChanged();
      addNotification({
        title: "Schedule rescheduled",
        message: "Your planner rebuilt the timetable using the latest constraints.",
        kind: "schedule",
      });
      setSuccess("Schedule replanned successfully");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to replan schedule");
    } finally {
      setIsReplanning(false);
    }
  }

  async function handleUpdateAvailability(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setError("");
      setSuccess("");
      setIsSavingAvailability(true);
      const previousAvailability = {
        availableFrom: schedule?.availability.availableFrom,
        availableTo: schedule?.availability.availableTo,
        breakStart: schedule?.availability.breakStart,
        breakEnd: schedule?.availability.breakEnd,
      };

      await api.put("/users/availability", {
        availableFrom,
        availableTo,
        breakStart,
        breakEnd,
        freeDays,
      });

      const response = await api.get("/schedule/plan");
      const data = response.data;

      setSchedule(data);
      syncAtRiskNotifications(data.plan ?? []);
      const firstPlannedDate = data.plan?.length ? parseISO(data.plan[0].date) : undefined;
      setSelectedDate(firstPlannedDate);
      setViewMonth(firstPlannedDate ?? new Date());
      notifyScheduleChanged();
      addNotification({
        title: "Availability updated",
        message: `Working hours were updated to ${availableFrom} - ${availableTo}.`,
        kind: "availability",
      });

      if (
        previousAvailability.breakStart !== breakStart ||
        previousAvailability.breakEnd !== breakEnd
      ) {
        addNotification({
          title: "Break time updated",
          message: `Your break window is now ${breakStart} - ${breakEnd}.`,
          kind: "availability",
        });
      }

      setSuccess("Availability updated successfully");
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0]?.message || "Validation failed");
      } else {
        setError(err.response?.data?.message || "Failed to update availability");
      }
    } finally {
      setIsSavingAvailability(false);
    }
  }

  async function handleDownloadCalendar() {
    try {
      setError("");
      setIsDownloadingCalendar(true);

      const calendarUrl = getCalendarEndpoint("/calendar/download-all");

      const response = await api.get(calendarUrl, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/calendar" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "schedule.ics";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to download Apple Calendar file"
      );
    } finally {
      setIsDownloadingCalendar(false);
    }
  }

  async function handleImportCalendar(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      setIsImportingCalendar(true);

      const formData = new FormData();
      formData.append("file", file);

      await api.post(getCalendarEndpoint("/calendar/import-ics"), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await Promise.all([fetchSchedule(), fetchImportedEvents()]);
      notifyScheduleChanged();
      setSuccess("Calendar imported successfully and busy times were applied.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to import calendar");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setIsImportingCalendar(false);
    }
  }

  async function handleClearImportedCalendar() {
    try {
      setError("");
      setSuccess("");
      setIsClearingCalendar(true);

      await api.delete(getCalendarEndpoint("/calendar/events"));
      await Promise.all([fetchSchedule(), fetchImportedEvents()]);
      notifyScheduleChanged();
      setSuccess("Imported calendar events cleared successfully.");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to clear imported calendar events"
      );
    } finally {
      setIsClearingCalendar(false);
    }
  }

  useEffect(() => {
    fetchSchedule();
    fetchImportedEvents();
  }, []);

  const blocksByDate = useMemo(() => {
    const normalizedBlocks = new Map<string, PlannedTaskBlock>();

    for (const block of schedule?.plan ?? []) {
      const normalizedKey = [
        block.date,
        block.start,
        block.end,
        block.title.trim().toLowerCase(),
        block.duration,
      ].join("|");

      if (!normalizedBlocks.has(normalizedKey)) {
        normalizedBlocks.set(normalizedKey, block);
      }
    }

    const grouped = new Map<string, PlannedTaskBlock[]>();

    for (const block of normalizedBlocks.values()) {
      const existing = grouped.get(block.date) ?? [];

      grouped.set(
        block.date,
        [...existing, block].sort((a, b) => a.start.localeCompare(b.start))
      );
    }

    return grouped;
  }, [schedule]);

  const scheduledDates = useMemo(
    () => Array.from(blocksByDate.keys()).map((date) => parseISO(date)),
    [blocksByDate]
  );

  const activeDate =
    selectedDate ??
    (scheduledDates.length > 0 ? scheduledDates[0] : undefined);

  const selectedDayKey = activeDate ? format(activeDate, "yyyy-MM-dd") : "";
  const selectedDayBlocks = selectedDayKey
    ? blocksByDate.get(selectedDayKey) ?? []
    : [];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(246,248,251,1),rgba(255,255,255,1))]">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border-border/70 bg-background/90 py-0 shadow-none">
          <CardHeader className="space-y-3 px-6 pt-6">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              Availability
            </Badge>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                Working hours
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                Adjust your available time, then replan to refresh the calendar.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-6 pb-6">
            {error && (
              <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                <AlertTitle>Schedule action failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-border/70 bg-muted/20">
                <AlertTitle>Updated</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {!loading && schedule?.scheduleLightened && (
              <Alert className="border-amber-200 bg-amber-50/70">
                <AlertTitle>Today's wellbeing was applied</AlertTitle>
                <AlertDescription>
                  Level {schedule.appliedWellbeingLevel} reduced today's capacity to{" "}
                  {schedule.effectiveWorkHours ?? 0} hours and kept{" "}
                  {schedule.reservedRestMinutes ?? 0} minutes open for rest.
                  {schedule.wellbeingNote
                    ? ` Note: ${schedule.wellbeingNote}`
                    : ""}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleUpdateAvailability} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="availableFrom">Available from</Label>
                  <Input
                    id="availableFrom"
                    type="time"
                    value={availableFrom}
                    onChange={(event) => setAvailableFrom(event.target.value)}
                    className="h-11 rounded-xl bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availableTo">Available to</Label>
                  <Input
                    id="availableTo"
                    type="time"
                    value={availableTo}
                    onChange={(event) => setAvailableTo(event.target.value)}
                    className="h-11 rounded-xl bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breakStart">Break start</Label>
                  <Input
                    id="breakStart"
                    type="time"
                    value={breakStart}
                    onChange={(event) => setBreakStart(event.target.value)}
                    className="h-11 rounded-xl bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="breakEnd">Break end</Label>
                  <Input
                    id="breakEnd"
                    type="time"
                    value={breakEnd}
                    onChange={(event) => setBreakEnd(event.target.value)}
                    className="h-11 rounded-xl bg-background"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Free days</Label>
                  <p className="text-sm text-muted-foreground">
                    Tasks will not be scheduled on the days you mark as free.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => {
                    const selected = freeDays.includes(day.key);

                    return (
                      <Button
                        key={day.key}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        className="h-10 rounded-full px-4 text-sm"
                        onClick={() =>
                          setFreeDays((current) =>
                            current.includes(day.key)
                              ? current.filter((item) => item !== day.key)
                              : [...current, day.key]
                          )
                        }
                      >
                        {day.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  className="h-11 rounded-full px-5 text-sm"
                  disabled={isSavingAvailability}
                >
                  {isSavingAvailability ? "Saving..." : "Update availability"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full px-5 text-sm"
                  onClick={handleReplan}
                  disabled={isReplanning}
                >
                  {isReplanning ? "Replanning..." : "Replan schedule"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 rounded-full px-5 text-sm"
                  onClick={handleDownloadCalendar}
                  disabled={isDownloadingCalendar}
                >
                  {isDownloadingCalendar
                    ? "Preparing .ics..."
                    : "Download Apple Calendar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full px-5 text-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImportingCalendar}
                >
                  {isImportingCalendar ? "Importing .ics..." : "Import Apple .ics"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full px-5 text-sm"
                  onClick={handleClearImportedCalendar}
                  disabled={isClearingCalendar || importedEvents.length === 0}
                >
                  {isClearingCalendar ? "Clearing..." : "Clear imported calendar"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ics,text/calendar"
                  className="hidden"
                  onChange={handleImportCalendar}
                />
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/90 py-0 shadow-none">
          <CardHeader className="space-y-2 px-6 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold text-foreground">
                  Imported busy events
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  These Apple Calendar events are treated as blocked time when the planner builds your schedule.
                </CardDescription>
              </div>

              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {importedEvents.length} imported
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 px-6 pb-6">
            {importedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No external calendar events imported yet.
              </p>
            ) : (
              importedEvents.slice(0, 6).map((event) => (
                <div
                  key={event._id}
                  className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3"
                >
                  <p className="font-medium text-foreground">{event.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.allDay
                      ? `${new Date(event.start).toLocaleDateString()} · All day`
                      : `${new Date(event.start).toLocaleString()} - ${new Date(
                          event.end
                        ).toLocaleString()}`}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-background/90 py-0 shadow-none">
          <CardHeader className="space-y-2 px-6 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold text-foreground">
                  Schedule calendar
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  Click a date to see only the tasks planned for that day.
                </CardDescription>
              </div>

              {!loading && (
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  {schedule?.totalBlocks ?? 0} planned blocks
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {loading ? (
              <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                <Skeleton className="min-h-[32rem] rounded-2xl" />
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 rounded-2xl" />
                  ))}
                </div>
              </div>
            ) : schedule && schedule.plan.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                <div className="flex min-h-[32rem] justify-center rounded-[1.5rem] border border-border/70 bg-muted/10 p-3">
                  <Calendar
                    mode="single"
                    selected={activeDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      if (date) {
                        setViewMonth(date);
                      }
                    }}
                    month={viewMonth}
                    onMonthChange={setViewMonth}
                    showOutsideDays={false}
                    className="mx-auto w-full max-w-[30rem]"
                    classNames={{
                      day: "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none",
                    }}
                    components={{
                      DayButton: ({ day, modifiers, className, ...props }) => {
                        const blockCount =
                          blocksByDate.get(format(day.date, "yyyy-MM-dd"))?.length ?? 0;

                        return (
                          <div className="relative">
                            <CalendarDayButton
                              day={day}
                              modifiers={modifiers}
                              className={cn(
                                blockCount > 0 &&
                                  !modifiers.selected &&
                                  "bg-accent/45 text-accent-foreground hover:bg-accent/65",
                                className
                              )}
                              {...props}
                            />
                            {blockCount > 0 && (
                              <span className="pointer-events-none absolute right-1.5 bottom-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                                {blockCount}
                              </span>
                            )}
                          </div>
                        );
                      },
                    }}
                  />
                </div>

                <div className="flex min-h-[32rem] flex-col gap-4">
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {activeDate ? format(activeDate, "EEEE") : "No date selected"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {activeDate ? format(activeDate, "MMMM d") : "Select a date"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedDayBlocks.length} task
                      {selectedDayBlocks.length === 1 ? "" : "s"} scheduled.
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1">
                    <div className="space-y-4">
                      {selectedDayBlocks.length > 0 ? (
                        selectedDayBlocks.map((block, index) => (
                          <Card
                            key={`${block.taskId}-${index}`}
                            className="border-border/70 bg-background py-0 shadow-none"
                          >
                            <CardContent className="space-y-3 px-5 py-5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-lg font-semibold text-foreground">
                                    {block.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {block.start} to {block.end}
                                  </p>
                                </div>
                                <Badge
                                  variant={statusBadgeVariant[block.status]}
                                  className="rounded-full px-3 py-1"
                                >
                                  {block.status}
                                </Badge>
                              </div>

                              <Separator />

                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                <span>{block.duration} min</span>
                                <span>&middot;</span>
                                <span className="capitalize">{block.priority} priority</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Card className="border-dashed border-border/70 bg-muted/20 py-0 shadow-none">
                          <CardContent className="space-y-2 px-6 py-10 text-center">
                            <p className="text-lg font-medium text-foreground">
                              No tasks on this date
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Pick a highlighted day to see its schedule.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Card className="border-dashed border-border/70 bg-muted/20 py-0 shadow-none">
                <CardContent className="space-y-2 px-6 py-10 text-center">
                  <p className="text-lg font-medium text-foreground">
                    No calendar entries yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add tasks or replan the schedule to populate the calendar.
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default Schedule;
