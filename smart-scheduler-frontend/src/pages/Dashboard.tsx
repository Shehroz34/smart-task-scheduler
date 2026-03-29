import { useEffect, useMemo, useState } from "react";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import type { EventDropArg, EventInput } from "@fullcalendar/core";

import Navbar from "@/components/Navbar";
import CalendarView from "@/components/CalendarView";
import { getSchedule, type ScheduleEvent, updateScheduledTask } from "@/api/schedule";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const scheduleRefreshKey = "scheduleLastUpdatedAt";

function Dashboard() {
  const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSchedule() {
    try {
      setLoading(true);
      setError("");
      const data = await getSchedule();
      setSchedule(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }

  async function handleEventChange(eventChange: EventDropArg | EventResizeDoneArg) {
    const taskId = String(eventChange.event.extendedProps.taskId || eventChange.event.id);
    const start = eventChange.event.start;
    const end = eventChange.event.end;

    if (!start || !end) {
      eventChange.revert();
      return;
    }

    try {
      await updateScheduledTask(taskId, start.toISOString(), end.toISOString());
      await loadSchedule();
    } catch (err) {
      eventChange.revert();
      setError("Failed to update task timing");
    }
  }

  useEffect(() => {
    loadSchedule();
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === scheduleRefreshKey) {
        loadSchedule();
      }
    }

    function handleWindowFocus() {
      loadSchedule();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, []);

  const calendarEvents = useMemo<EventInput[]>(
    () =>
      schedule.map((item) => ({
        id: item.id,
        title: item.title,
        start: item.startTime,
        end: item.endTime,
        extendedProps: {
          taskId: item.taskId,
        },
      })),
    [schedule]
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(246,248,251,1),rgba(255,255,255,1))]">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border-border/70 bg-background/90 py-0 shadow-none">
          <CardHeader className="space-y-3 px-6 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  Weekly View
                </Badge>
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                    My Schedule
                  </CardTitle>
                  <CardDescription className="max-w-3xl text-sm leading-6">
                    Review your week in an Apple Calendar-like timetable. Drag tasks to adjust their time blocks.
                  </CardDescription>
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Scheduled blocks
                </p>
                <p className="mt-1 text-3xl font-semibold text-foreground">
                  {schedule.length}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-6">
            {error && (
              <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                <AlertTitle>Schedule unavailable</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-48 rounded-xl" />
                <Skeleton className="min-h-[680px] w-full rounded-3xl" />
              </div>
            ) : (
              <CalendarView events={calendarEvents} onEventChange={handleEventChange} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default Dashboard;
