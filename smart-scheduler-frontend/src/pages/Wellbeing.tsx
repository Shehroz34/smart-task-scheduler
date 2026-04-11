import { useEffect, useState } from "react";

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
import { cn } from "@/lib/utils";

type WellbeingLevel = 1 | 2 | 3 | 4;

interface WellbeingResponse {
  wellbeing: {
    wellbeingLevel: WellbeingLevel;
    note?: string;
    date: string;
  } | null;
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
  const [selectedLevel, setSelectedLevel] = useState<WellbeingLevel | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  async function handleSave() {
    if (!selectedLevel) {
      setError("Please select how you are feeling today.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      await api.post("/wellbeing", {
        wellbeingLevel: selectedLevel,
        note,
      });

      setSuccess("Wellbeing saved successfully.");
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0]?.message || "Failed to save wellbeing");
      } else {
        setError(err.response?.data?.message || "Failed to save wellbeing");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(246,248,251,1),rgba(255,255,255,1))]">
      <Navbar />

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border-border/70 bg-background/90 py-0 shadow-none">
          <CardHeader className="space-y-3 px-6 pt-6">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              Daily check-in
            </Badge>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                How are you feeling today?
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                Pick the level that matches your energy today and optionally leave a short note.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-6">
            {error && (
              <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                <AlertTitle>Unable to save wellbeing</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-border/70 bg-muted/20">
                <AlertTitle>Saved</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Today's energy level</Label>
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
                          "flex min-h-20 flex-col items-center justify-center rounded-2xl px-3 py-4 text-center transition-all",
                          isSelected ? option.activeClassName : option.barClassName
                        )}
                      >
                        <span className="text-lg font-semibold">
                          {option.level}
                        </span>
                        <span className="mt-1 text-xs font-medium uppercase tracking-[0.14em]">
                          {option.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-4">
                {selectedOption ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                        Selected level
                      </p>
                      <p className="text-xl font-semibold text-foreground">
                        {selectedOption.title}
                      </p>
                    </div>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      {selectedOption.description}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a point on the bar to record how much focused work you feel able to handle today.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wellbeing-note">Add a note</Label>
              <Textarea
                id="wellbeing-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note about your energy, focus, or workload today."
                className="min-h-32 rounded-xl bg-background"
                disabled={loading}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                className="h-11 rounded-full px-5 text-sm"
                onClick={handleSave}
                disabled={loading || isSaving}
              >
                {isSaving ? "Saving..." : "Save wellbeing"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default Wellbeing;
