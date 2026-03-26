import { useEffect, useMemo, useState } from "react";
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

interface TaskPlanningSummary {
  taskId: string;
  title: string;
  totalDuration: number;
  scheduledDuration: number;
  remainingDuration: number;
  deadline: string;
  priority: string;
  status: "scheduled" | "splitAcrossDays" | "atRisk" | "missedDeadline";
  reason?: string;
}

interface ScheduleResponse {
  availability: {
    availableFrom: string;
    availableTo: string;
    breakStart: string;
    breakEnd: string;
  };
  totalTasks: number;
  totalBlocks: number;
  stats: {
    scheduled: number;
    splitAcrossDays: number;
    atRisk: number;
    missedDeadline: number;
  };
  plan: PlannedTaskBlock[];
  summaries: TaskPlanningSummary[];
}

const statusBadgeVariant = {
  scheduled: "secondary",
  splitAcrossDays: "outline",
  atRisk: "destructive",
  missedDeadline: "destructive",
} as const;

function Schedule() {
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const [availableFrom, setAvailableFrom] = useState("09:00");
  const [availableTo, setAvailableTo] = useState("18:00");
  const [breakStart, setBreakStart] = useState("13:00");
  const [breakEnd, setBreakEnd] = useState("14:00");

  async function fetchSchedule() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/schedule/plan");
      const data = response.data;

      setSchedule(data);

      if (data.availability) {
        setAvailableFrom(data.availability.availableFrom);
        setAvailableTo(data.availability.availableTo);
        setBreakStart(data.availability.breakStart);
        setBreakEnd(data.availability.breakEnd);
      }

      if (data.plan?.length) {
        setSelectedDate(parseISO(data.plan[0].date));
      } else {
        setSelectedDate(undefined);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load schedule");
    } finally {
      setLoading(false);
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
      setSelectedDate(data.plan?.length ? parseISO(data.plan[0].date) : undefined);
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

      await api.put("/users/availability", {
        availableFrom,
        availableTo,
        breakStart,
        breakEnd,
      });

      const response = await api.get("/schedule/plan");
      const data = response.data;

      setSchedule(data);
      setSelectedDate(data.plan?.length ? parseISO(data.plan[0].date) : undefined);
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

  useEffect(() => {
    fetchSchedule();
  }, []);

  const blocksByDate = useMemo(() => {
    const grouped = new Map<string, PlannedTaskBlock[]>();

    for (const block of schedule?.plan ?? []) {
      const existing = grouped.get(block.date) ?? [];
      existing.push(block);
      grouped.set(block.date, existing);
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
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-border/70 bg-background/90 py-0 shadow-none">
            <CardHeader className="space-y-3 px-6 pt-6">
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                Availability
              </Badge>
              <div className="space-y-1">
                <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                  Define your working window
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  Set the hours the scheduler can use, then replan around your
                  actual workday.
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

              <form onSubmit={handleUpdateAvailability} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
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
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    className="h-11 rounded-full px-5 text-sm"
                    disabled={isSavingAvailability}
                  >
                    {isSavingAvailability
                      ? "Saving..."
                      : "Update availability"}
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
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-background/90 py-0 shadow-none">
            <CardHeader className="space-y-3 px-6 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    Snapshot
                  </Badge>
                  <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                    Schedule health
                  </CardTitle>
                  <CardDescription className="text-sm leading-6">
                    Check how many tasks fit, split, or miss their deadlines.
                  </CardDescription>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Planned blocks
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-foreground">
                    {schedule?.totalBlocks ?? 0}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="border-border/70 py-0 shadow-none">
                      <CardContent className="space-y-3 px-5 py-5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-20" />
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))
                : [
                    {
                      label: "Total tasks",
                      value: schedule?.totalTasks ?? 0,
                    },
                    {
                      label: "Scheduled",
                      value: schedule?.stats.scheduled ?? 0,
                    },
                    {
                      label: "Split across days",
                      value: schedule?.stats.splitAcrossDays ?? 0,
                    },
                    {
                      label: "Missed deadline",
                      value: schedule?.stats.missedDeadline ?? 0,
                    },
                  ].map((item) => (
                    <Card
                      key={item.label}
                      className="border-border/70 bg-background py-0 shadow-none"
                    >
                      <CardContent className="space-y-2 px-5 py-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="text-4xl font-semibold tracking-tight text-foreground">
                          {item.value}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/70 bg-background/90 py-0 shadow-none">
            <CardHeader className="space-y-2 px-6 pt-6">
              <CardTitle className="text-2xl font-semibold text-foreground">
                Schedule calendar
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                Every scheduled task is grouped by day in the calendar. Select a
                date to inspect its tasks.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              {loading ? (
                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <Skeleton className="min-h-[360px] rounded-2xl" />
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-24 rounded-2xl" />
                    ))}
                  </div>
                </div>
              ) : schedule && schedule.plan.length > 0 ? (
                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="rounded-[1.5rem] border border-border/70 bg-muted/10 p-3">
                    <Calendar
                      mode="single"
                      selected={activeDate}
                      onSelect={setSelectedDate}
                      month={activeDate}
                      onMonthChange={setSelectedDate}
                      modifiers={{
                        scheduled: scheduledDates,
                      }}
                      classNames={{
                        day: "group/day relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none",
                      }}
                      components={{
                        DayButton: ({ day, modifiers, className, ...props }) => {
                          const blockCount =
                            blocksByDate.get(format(day.date, "yyyy-MM-dd"))
                              ?.length ?? 0;

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

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Selected date
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">
                        {activeDate
                          ? format(activeDate, "EEEE, MMMM d")
                          : "No date selected"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedDayBlocks.length} scheduled block
                        {selectedDayBlocks.length === 1 ? "" : "s"} on this day.
                      </p>
                    </div>

                    {selectedDayBlocks.length > 0 ? (
                      selectedDayBlocks.map((block, index) => (
                        <Card
                          key={`${block.taskId}-${index}`}
                          className="border-border/70 bg-background py-0 shadow-none"
                        >
                          <CardHeader className="space-y-3 px-5 pt-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-1">
                                <CardTitle className="text-xl font-semibold text-foreground">
                                  {block.title}
                                </CardTitle>
                                <CardDescription className="text-sm leading-6">
                                  {block.start} to {block.end}
                                </CardDescription>
                              </div>
                              <Badge
                                variant={statusBadgeVariant[block.status]}
                                className="rounded-full px-3 py-1"
                              >
                                {block.status}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4 px-5 pb-5">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="rounded-full px-3 py-1">
                                {block.duration} min
                              </Badge>
                              <Badge variant="secondary" className="rounded-full px-3 py-1">
                                {block.priority} priority
                              </Badge>
                            </div>

                            <Separator />

                            <p className="text-sm text-muted-foreground">
                              Deadline:{" "}
                              <span className="font-medium text-foreground">
                                {new Date(block.deadline).toLocaleString()}
                              </span>
                            </p>
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
                            Select a highlighted day in the calendar to inspect
                            its scheduled tasks.
                          </p>
                        </CardContent>
                      </Card>
                    )}
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

          <Card className="border-border/70 bg-background/90 py-0 shadow-none">
            <CardHeader className="space-y-2 px-6 pt-6">
              <CardTitle className="text-2xl font-semibold text-foreground">
                Task summaries
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                A per-task breakdown of scheduled time, remaining effort, and risk.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-6 pb-6">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="border-border/70 py-0 shadow-none">
                    <CardContent className="space-y-3 px-5 py-5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))
              ) : schedule && schedule.summaries.length > 0 ? (
                schedule.summaries.map((item) => (
                  <Card
                    key={item.taskId}
                    className="border-border/70 bg-background py-0 shadow-none"
                  >
                    <CardHeader className="space-y-3 px-5 pt-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-semibold text-foreground">
                            {item.title}
                          </CardTitle>
                          <CardDescription className="text-sm leading-6">
                            Deadline {new Date(item.deadline).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={statusBadgeVariant[item.status]}
                          className="rounded-full px-3 py-1"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 px-5 pb-5">
                      <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                        <p>
                          Total:{" "}
                          <span className="font-medium text-foreground">
                            {item.totalDuration} min
                          </span>
                        </p>
                        <p>
                          Scheduled:{" "}
                          <span className="font-medium text-foreground">
                            {item.scheduledDuration} min
                          </span>
                        </p>
                        <p>
                          Remaining:{" "}
                          <span className="font-medium text-foreground">
                            {item.remainingDuration} min
                          </span>
                        </p>
                        <p>
                          Priority:{" "}
                          <span className="font-medium capitalize text-foreground">
                            {item.priority}
                          </span>
                        </p>
                      </div>

                      {item.reason && (
                        <>
                          <Separator />
                          <p className="text-sm leading-6 text-muted-foreground">
                            {item.reason}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed border-border/70 bg-muted/20 py-0 shadow-none">
                  <CardContent className="space-y-2 px-6 py-10 text-center">
                    <p className="text-lg font-medium text-foreground">
                      No summaries yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Schedule data will appear here once tasks are planned.
                    </p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default Schedule;
