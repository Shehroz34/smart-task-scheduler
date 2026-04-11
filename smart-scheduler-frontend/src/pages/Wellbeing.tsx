import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addNotification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

type WellbeingLevel = 1 | 2 | 3 | 4;

interface WellbeingResponse {
  wellbeing: {
    wellbeingLevel: WellbeingLevel;
    note?: string;
    date: string;
  } | null;
}

interface AIWellbeingResult {
  summary: string;
  wellbeingFocus: string;
  taskPreference: "easy_first" | "easy_then_medium" | "balanced";
  tips: string[];
  scheduleActions: string[];
  suggestedActivities: Array<{
    title: string;
    reason: string;
    durationMinutes: number;
    activityType: "rest" | "movement" | "recovery" | "mindfulness" | "healthy_habit";
    preferredTimeOfDay: "morning" | "afternoon" | "evening" | "anytime";
  }>;
  warning: string;
}

function getSuggestionDeadline(preferredTimeOfDay: AIWellbeingResult["suggestedActivities"][number]["preferredTimeOfDay"]) {
  const target = new Date();
  const hourMap = {
    morning: 11,
    afternoon: 15,
    evening: 19,
    anytime: 18,
  } as const;

  target.setHours(hourMap[preferredTimeOfDay], 0, 0, 0);

  if (target.getTime() <= Date.now()) {
    target.setDate(target.getDate() + 1);
  }

  return target.toISOString();
}

const wellbeingOptions: Array<{
  level: WellbeingLevel;
  title: string;
  description: string;
  barClassName: string;
  activeClassName: string;
}> = [
  {
    level: 1,
    title: "Very low",
    description: "1.5-2 hrs work",
    barClassName: "bg-rose-300 hover:bg-rose-400",
    activeClassName: "bg-rose-500 text-white ring-4 ring-rose-200",
  },
  {
    level: 2,
    title: "Low",
    description: "3-4 hrs work",
    barClassName: "bg-amber-300 hover:bg-amber-400",
    activeClassName: "bg-amber-500 text-white ring-4 ring-amber-200",
  },
  {
    level: 3,
    title: "Moderate",
    description: "4-5 hrs work",
    barClassName: "bg-lime-300 hover:bg-lime-400",
    activeClassName: "bg-lime-500 text-white ring-4 ring-lime-200",
  },
  {
    level: 4,
    title: "Normal",
    description: "Full availability",
    barClassName: "bg-emerald-300 hover:bg-emerald-400",
    activeClassName: "bg-emerald-500 text-white ring-4 ring-emerald-200",
  },
];

function Wellbeing() {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<WellbeingLevel | null>(null);
  const [note, setNote] = useState("");
  const [aiNote, setAINote] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingAI, setIsCheckingAI] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [aiResult, setAIResult] = useState<AIWellbeingResult | null>(null);
  const [aiSource, setAISource] = useState<"openai" | "fallback" | null>(null);
  const [addingActivityTitles, setAddingActivityTitles] = useState<string[]>([]);
  const selectedOption =
    wellbeingOptions.find((option) => option.level === selectedLevel) ?? null;

  async function fetchTodayWellbeing() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<WellbeingResponse>("/wellbeing/today");
      const wellbeing = response.data.wellbeing;

      if (wellbeing) {
        setSelectedLevel(wellbeing.wellbeingLevel);
        setNote(wellbeing.note || "");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load wellbeing");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTodayWellbeing();
  }, []);

  async function persistWellbeing(showSuccessMessage = true) {
    if (!selectedLevel) {
      setError("Please select how you are feeling today.");
      return false;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      await api.post("/wellbeing", {
        wellbeingLevel: selectedLevel,
        note,
      });

      if (showSuccessMessage) {
        setSuccess("Wellbeing saved successfully.");
      }
      return true;
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0]?.message || "Failed to save wellbeing");
      } else {
        setError(err.response?.data?.message || "Failed to save wellbeing");
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave() {
    await persistWellbeing(true);
  }

  async function handleSaveAndReplan() {
    const saved = await persistWellbeing(false);

    if (!saved) {
      return;
    }

    try {
      setIsSaving(true);
      await api.get("/schedule/replan");
      addNotification({
        title: "Schedule replanned",
        message: "Your schedule was updated using the current wellbeing setting.",
        kind: "schedule",
      });
      setSuccess("Wellbeing saved and schedule replanned.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to replan schedule");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAICheck() {
    if (!aiNote.trim()) {
      setError("Please describe what feels wrong today before asking AI.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setIsCheckingAI(true);

      const response = await api.post("/wellbeing/ai-check", {
        note: aiNote,
      });

      setAIResult(response.data.result);
      setAISource(response.data.source);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to get AI suggestions");
    } finally {
      setIsCheckingAI(false);
    }
  }

  async function addActivityToSchedule(activity: AIWellbeingResult["suggestedActivities"][number]) {
    try {
      setError("");
      setSuccess("");
      setAddingActivityTitles((current) => [...current, activity.title]);

      await api.post("/tasks", {
        title: activity.title,
        description: `AI wellbeing suggestion: ${activity.reason}`,
        duration: activity.durationMinutes,
        deadline: getSuggestionDeadline(activity.preferredTimeOfDay),
        priority: "low",
        difficulty: "easy",
        status: "pending",
      });

      addNotification({
        title: "Wellbeing activity added",
        message: `${activity.title} was added to your task queue for scheduling.`,
        kind: "task",
      });
      setSuccess(`${activity.title} was added to your task queue. Replan the schedule to place it.`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add wellbeing activity");
    } finally {
      setAddingActivityTitles((current) =>
        current.filter((title) => title !== activity.title)
      );
    }
  }

  async function addAllActivitiesToSchedule() {
    if (!aiResult) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      setIsSaving(true);

      await Promise.all(aiResult.suggestedActivities.map((activity) =>
        api.post("/tasks", {
          title: activity.title,
          description: `AI wellbeing suggestion: ${activity.reason}`,
          duration: activity.durationMinutes,
          deadline: getSuggestionDeadline(activity.preferredTimeOfDay),
          priority: "low",
          difficulty: "easy",
          status: "pending",
        })
      ));

      addNotification({
        title: "Wellbeing activities added",
        message: `${aiResult.suggestedActivities.length} AI suggestions were added to your task queue.`,
        kind: "task",
      });
      setSuccess("AI wellbeing activities were added. Replan the schedule to place them.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add AI suggestions");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(246,248,251,1),rgba(255,255,255,1))]">
      <Navbar />

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-8">
        <Card className="border-border/70 bg-background/90 shadow-none">
          <CardHeader className="space-y-3 border-b border-border/60 px-6 py-5">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              Daily check-in
            </Badge>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                How are you feeling today?
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                Use AI to turn how you feel into schedule-ready recovery activities.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-[calc(100vh-12rem)] flex-col px-0 pb-0">
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              {error && (
                <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                  <AlertTitle>Wellbeing issue</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-border/70 bg-muted/20">
                  <AlertTitle>Updated</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {!aiResult && (
                <div className="rounded-3xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center">
                  <p className="text-lg font-semibold text-foreground">
                    Ask for something concrete
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Example: "I feel drained today and need recovery time" or "I want to improve my health by adding running."
                  </p>
                </div>
              )}

              {aiResult && (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-border/70 bg-muted/10 px-5 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                          AI response
                        </p>
                        <p className="text-xl font-semibold text-foreground">
                          {aiResult.summary}
                        </p>
                      </div>
                      <Badge variant="secondary" className="rounded-full px-3 py-1">
                        {aiSource === "fallback" ? "Fallback" : "OpenAI"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-background px-5 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Wellbeing focus
                      </p>
                      <p className="mt-2 text-base font-semibold text-foreground">
                        {aiResult.wellbeingFocus}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background px-5 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Task preference
                      </p>
                      <p className="mt-2 text-base font-semibold capitalize text-foreground">
                        {aiResult.taskPreference.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-background px-5 py-4">
                      <p className="text-sm font-semibold text-foreground">Tips</p>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {aiResult.tips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background px-5 py-4">
                      <p className="text-sm font-semibold text-foreground">Schedule actions</p>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {aiResult.scheduleActions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-3xl border border-border/70 bg-background px-5 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        Suggested activities
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 rounded-full px-4 text-sm"
                        onClick={addAllActivitiesToSchedule}
                        disabled={isSaving}
                      >
                        {isSaving ? "Adding..." : "Add all to schedule"}
                      </Button>
                    </div>

                    <div className="grid gap-3">
                      {aiResult.suggestedActivities.map((activity) => {
                        const isAdding = addingActivityTitles.includes(activity.title);

                        return (
                          <div
                            key={`${activity.title}-${activity.preferredTimeOfDay}`}
                            className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/10 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-foreground">
                                  {activity.title}
                                </p>
                                <Badge variant="outline" className="rounded-full px-3 py-1">
                                  {activity.durationMinutes} min
                                </Badge>
                                <Badge variant="secondary" className="rounded-full px-3 py-1 capitalize">
                                  {activity.preferredTimeOfDay}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {activity.reason}
                              </p>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 rounded-full px-4 text-sm"
                              onClick={() => addActivityToSchedule(activity)}
                              disabled={isAdding || isSaving}
                            >
                              {isAdding ? "Adding..." : "Add to schedule"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {aiResult.warning && (
                    <Alert className="border-amber-200 bg-amber-50/70">
                      <AlertTitle>AI safety note</AlertTitle>
                      <AlertDescription>{aiResult.warning}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-border/60 bg-background/95 px-6 py-5">
              <div className="space-y-3 rounded-3xl border border-border/70 bg-muted/10 p-4">
                <div className="space-y-1">
                  <Label htmlFor="ai-note">What do you need today?</Label>
                  <p className="text-sm text-muted-foreground">
                    Write like a prompt. The AI will return practical activities you can add into the schedule.
                  </p>
                </div>
                <Textarea
                  id="ai-note"
                  value={aiNote}
                  onChange={(event) => setAINote(event.target.value)}
                  placeholder="I feel mentally exhausted and want one rest activity plus one gentle movement activity."
                  className="min-h-28 rounded-2xl bg-background"
                  disabled={loading || isCheckingAI}
                />
                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 rounded-full px-5 text-sm"
                    onClick={() => navigate("/schedule")}
                  >
                    Open schedule
                  </Button>
                  <Button
                    type="button"
                    className="h-11 rounded-full px-5 text-sm"
                    onClick={handleAICheck}
                    disabled={loading || isCheckingAI}
                  >
                    {isCheckingAI ? "Generating..." : "Get AI Suggestions"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit border-border/70 bg-background/95 shadow-none lg:sticky lg:top-24">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-semibold text-foreground">
              Wellbeing
            </CardTitle>
            <CardDescription>
              Keep this small panel for today’s level and replan from here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Today&apos;s energy</Label>
              <div className="grid grid-cols-4 gap-2 rounded-3xl border border-border/70 bg-muted/20 p-2">
                {wellbeingOptions.map((option) => {
                  const isSelected = selectedLevel === option.level;

                  return (
                    <button
                      key={option.level}
                      type="button"
                      onClick={() => setSelectedLevel(option.level)}
                      disabled={loading}
                      className={cn(
                        "flex min-h-16 flex-col items-center justify-center rounded-2xl px-2 py-3 text-center transition-all",
                        isSelected ? option.activeClassName : option.barClassName
                      )}
                    >
                      <span className="text-base font-semibold">{option.level}</span>
                      <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em]">
                        {option.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-4">
              {selectedOption ? (
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    Selected level
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedOption.title}
                  </p>
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {selectedOption.description}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Choose a level before saving or replanning.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="wellbeing-note">Note</Label>
              <Textarea
                id="wellbeing-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note about your energy today."
                className="min-h-28 rounded-2xl bg-background"
                disabled={loading}
              />
            </div>

            <div className="grid gap-3">
              <Button
                type="button"
                className="h-11 rounded-full px-5 text-sm"
                onClick={handleSaveAndReplan}
                disabled={loading || isSaving}
              >
                {isSaving ? "Working..." : "Reschedule according to wellbeing"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full px-5 text-sm"
                onClick={handleSave}
                disabled={loading || isSaving}
              >
                Save wellbeing only
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default Wellbeing;
