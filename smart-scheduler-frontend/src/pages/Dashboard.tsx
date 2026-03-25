import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "@/api/axios";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface Task {
  _id: string;
  status: "pending" | "completed";
}

interface ScheduleResponse {
  stats: {
    scheduled: number;
    splitAcrossDays: number;
    atRisk: number;
    missedDeadline: number;
  };
}

const statCards = [
  {
    key: "totalTasks",
    label: "Total tasks",
    description: "Everything currently tracked in your planner.",
    tone: "default",
  },
  {
    key: "pendingTasks",
    label: "Pending",
    description: "Work still left to complete.",
    tone: "secondary",
  },
  {
    key: "completedTasks",
    label: "Completed",
    description: "Tasks already closed out.",
    tone: "secondary",
  },
  {
    key: "scheduledTasks",
    label: "Scheduled",
    description: "Tasks that fit cleanly into your calendar.",
    tone: "default",
  },
  {
    key: "splitTasks",
    label: "Split across days",
    description: "Tasks broken into more than one block.",
    tone: "outline",
  },
  {
    key: "atRiskTasks",
    label: "At risk",
    description: "Work that needs intervention soon.",
    tone: "destructive",
  },
  {
    key: "missedTasks",
    label: "Missed deadline",
    description: "Tasks that could not be placed in time.",
    tone: "destructive",
  },
] as const;

function Dashboard() {
  const [totalTasks, setTotalTasks] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [scheduledTasks, setScheduledTasks] = useState(0);
  const [splitTasks, setSplitTasks] = useState(0);
  const [atRiskTasks, setAtRiskTasks] = useState(0);
  const [missedTasks, setMissedTasks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError("");

      const [tasksResponse, scheduleResponse] = await Promise.all([
        api.get("/tasks"),
        api.get("/schedule/plan"),
      ]);

      const tasks: Task[] = tasksResponse.data.tasks || [];
      const schedule: ScheduleResponse = scheduleResponse.data;

      setTotalTasks(tasks.length);
      setPendingTasks(tasks.filter((task) => task.status === "pending").length);
      setCompletedTasks(
        tasks.filter((task) => task.status === "completed").length
      );

      setScheduledTasks(schedule.stats.scheduled || 0);
      setSplitTasks(schedule.stats.splitAcrossDays || 0);
      setAtRiskTasks(schedule.stats.atRisk || 0);
      setMissedTasks(schedule.stats.missedDeadline || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = {
    totalTasks,
    pendingTasks,
    completedTasks,
    scheduledTasks,
    splitTasks,
    atRiskTasks,
    missedTasks,
  };

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const focusMessage =
    atRiskTasks > 0
      ? `${atRiskTasks} task${atRiskTasks === 1 ? "" : "s"} need attention.`
      : "No tasks are currently at risk.";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(246,248,251,1),rgba(255,255,255,1))]">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/70 bg-background/90 py-0 shadow-none">
            <CardHeader className="space-y-4 px-6 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="rounded-full px-3 py-1">
                    Dashboard
                  </Badge>
                  <div className="space-y-1">
                    <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                      Smart Scheduler overview
                    </CardTitle>
                    <CardDescription className="max-w-2xl text-sm leading-6">
                      Monitor workload, scheduling health, and task completion
                      from one place.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button asChild variant="outline" className="h-10 rounded-full px-4 text-sm">
                    <Link to="/tasks">Manage tasks</Link>
                  </Button>
                  <Button asChild className="h-10 rounded-full px-4 text-sm">
                    <Link to="/schedule">Open schedule</Link>
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Completion
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {completionRate}%
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Based on {completedTasks} completed out of {totalTasks} tasks.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Focus signal
                  </p>
                  <p className="mt-2 text-lg font-medium text-foreground">
                    {focusMessage}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Schedule health
                  </p>
                  <p className="mt-2 text-lg font-medium text-foreground">
                    {scheduledTasks} scheduled, {splitTasks} split, {missedTasks} missed.
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-border/70 bg-[#1f2937] py-0 text-white shadow-none">
            <CardHeader className="space-y-2 px-6 pt-6">
              <Badge className="w-fit rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                Snapshot
              </Badge>
              <CardTitle className="text-2xl font-semibold text-white">
                Daily planning status
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-white/70">
                A quick read on whether your current workload is realistic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <div className="rounded-2xl bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                  Pending load
                </p>
                <p className="mt-2 text-4xl font-semibold">{pendingTasks}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                    At risk
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{atRiskTasks}</p>
                </div>
                <div className="rounded-2xl border border-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                    Missed
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{missedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {error && (
          <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
            <AlertTitle>Dashboard data unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 7 }).map((_, index) => (
                <Card key={index} className="border-border/70 py-0 shadow-none">
                  <CardContent className="space-y-4 px-6 py-6">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))
            : statCards.map((card) => (
                <Card
                  key={card.key}
                  className="border-border/70 bg-background/90 py-0 shadow-none transition-colors hover:bg-muted/20"
                >
                  <CardHeader className="space-y-3 px-6 pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <Badge
                        variant={
                          card.tone === "destructive"
                            ? "destructive"
                            : card.tone === "outline"
                              ? "outline"
                              : "secondary"
                        }
                        className="rounded-full px-3 py-1"
                      >
                        {card.label}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-4xl font-semibold tracking-tight text-foreground">
                        {stats[card.key]}
                      </CardTitle>
                      <CardDescription className="mt-2 text-sm leading-6">
                        {card.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
