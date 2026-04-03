import { useEffect, useState } from "react";
import type { FormEvent } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface Task {
  _id: string;
  title: string;
  description?: string;
  duration: number;
  deadline: string;
  priority: "low" | "medium" | "high";
  difficulty: "easy" | "medium" | "hard";
  status: "pending" | "completed";
}

const priorityBadgeVariant = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
} as const;

const difficultyBadgeVariant = {
  easy: "outline",
  medium: "secondary",
  hard: "destructive",
} as const;

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );

  async function fetchTasks() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/tasks");
      setTasks(response.data.tasks || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setDuration("");
    setDeadline("");
    setPriority("medium");
    setDifficulty("medium");
    setEditingTaskId(null);
    setFormError("");
  }

  function handleEditTask(task: Task) {
    setEditingTaskId(task._id);
    setTitle(task.title);
    setDescription(task.description || "");
    setDuration(String(task.duration));

    const localDate = new Date(task.deadline);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    const hours = String(localDate.getHours()).padStart(2, "0");
    const minutes = String(localDate.getMinutes()).padStart(2, "0");

    setDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
    setPriority(task.priority);
    setDifficulty(task.difficulty);
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const payload = {
        title,
        description,
        duration: Number(duration),
        deadline: new Date(deadline).toISOString(),
        priority,
        difficulty,
      };

      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, payload);
      } else {
        await api.post("/tasks", payload);
      }

      resetForm();
      await fetchTasks();
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const firstError = err.response.data.errors[0]?.message;
        setFormError(firstError || "Failed to save task");
      } else {
        setFormError(err.response?.data?.message || "Failed to save task");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCompleteTask(taskId: string) {
    try {
      await api.patch(`/tasks/${taskId}/complete`);
      await fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to complete task");
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      await api.delete(`/tasks/${taskId}`);

      if (editingTaskId === taskId) {
        resetForm();
      }

      await fetchTasks();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete task");
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(246,248,251,1),rgba(255,255,255,1))]">
      <Navbar />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-border/70 bg-background/90 py-0 shadow-none lg:min-h-[46rem]">
            <CardHeader className="space-y-3 px-6 pt-6">
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                Task studio
              </Badge>
              <div className="space-y-1">
                <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                  {editingTaskId ? "Refine an existing task" : "Add a new task"}
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  Define duration, deadline, priority, and difficulty so the
                  planner has enough signal to build a realistic schedule.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 px-6 pb-6">
              {formError && (
                <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                  <AlertTitle>Unable to save task</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Task title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Write API documentation"
                    className="h-11 rounded-xl bg-background"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Add context, deliverables, or notes for this task."
                    className="min-h-28 rounded-xl bg-background"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration in minutes</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                      placeholder="90"
                      className="h-11 rounded-xl bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={deadline}
                      onChange={(event) => setDeadline(event.target.value)}
                      className="h-11 rounded-xl bg-background"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={(value) =>
                        setPriority(value as "low" | "medium" | "high")
                      }
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl bg-background px-3 text-sm">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low priority</SelectItem>
                        <SelectItem value="medium">Medium priority</SelectItem>
                        <SelectItem value="high">High priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={difficulty}
                      onValueChange={(value) =>
                        setDifficulty(value as "easy" | "medium" | "hard")
                      }
                    >
                      <SelectTrigger className="h-11 w-full rounded-xl bg-background px-3 text-sm">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    className="h-11 rounded-full px-5 text-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingTaskId
                        ? "Update task"
                        : "Create task"}
                  </Button>

                  {editingTaskId && (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-full px-5 text-sm"
                      onClick={resetForm}
                    >
                      Cancel edit
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-background/90 py-0 shadow-none lg:min-h-[46rem]">
            <CardHeader className="space-y-3 px-6 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    Overview
                  </Badge>
                  <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
                    Task queue
                  </CardTitle>
                  <CardDescription className="text-sm leading-6">
                    Review current work, update details, and mark items complete.
                  </CardDescription>
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Active tasks
                  </p>
                  <p className="mt-1 text-3xl font-semibold text-foreground">
                    {tasks.filter((task) => task.status === "pending").length}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Keep the queue compact by default, then expand it only when you need a longer review session.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 rounded-full px-4 text-sm"
                  onClick={() => setIsQueueExpanded((current) => !current)}
                >
                  {isQueueExpanded ? "Slide up queue" : "Slide down queue"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6 pb-6">
              {error && (
                <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                  <AlertTitle>Task list unavailable</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div
                className={[
                  "overflow-hidden transition-[max-height] duration-300 ease-in-out",
                  isQueueExpanded ? "max-h-[70rem]" : "max-h-[34rem]",
                ].join(" ")}
              >
                <div
                  className={[
                    "space-y-4 pr-1",
                    isQueueExpanded ? "overflow-y-auto max-h-[70rem]" : "overflow-y-auto max-h-[34rem]",
                  ].join(" ")}
                >
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Card key={index} className="border-border/70 py-0 shadow-none">
                          <CardContent className="space-y-3 px-5 py-5">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : tasks.length === 0 ? (
                    <Card className="border-dashed border-border/70 bg-muted/20 py-0 shadow-none">
                      <CardContent className="space-y-2 px-6 py-10 text-center">
                        <p className="text-lg font-medium text-foreground">
                          No tasks yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Add your first task to start generating a schedule.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    tasks.map((task) => (
                      <Card
                        key={task._id}
                        className="border-border/70 bg-background py-0 shadow-none"
                      >
                        <CardHeader className="space-y-3 px-5 pt-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <CardTitle className="text-xl font-semibold text-foreground">
                                {task.title}
                              </CardTitle>
                              <CardDescription className="text-sm leading-6">
                                {task.description?.trim() || "No description provided."}
                              </CardDescription>
                            </div>

                            <Badge
                              variant={
                                task.status === "completed" ? "secondary" : "outline"
                              }
                              className="rounded-full px-3 py-1"
                            >
                              {task.status}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4 px-5 pb-5">
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant={priorityBadgeVariant[task.priority]}
                              className="rounded-full px-3 py-1"
                            >
                              {task.priority} priority
                            </Badge>
                            <Badge
                              variant={difficultyBadgeVariant[task.difficulty]}
                              className="rounded-full px-3 py-1"
                            >
                              {task.difficulty}
                            </Badge>
                            <Badge variant="outline" className="rounded-full px-3 py-1">
                              {task.duration} min
                            </Badge>
                          </div>

                          <Separator />

                          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                            <p>
                              Deadline:{" "}
                              <span className="font-medium text-foreground">
                                {new Date(task.deadline).toLocaleString()}
                              </span>
                            </p>
                            <p>
                              Status:{" "}
                              <span className="font-medium capitalize text-foreground">
                                {task.status}
                              </span>
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-10 rounded-full px-4 text-sm"
                              onClick={() => handleEditTask(task)}
                            >
                              Edit
                            </Button>

                            {task.status === "pending" && (
                              <Button
                                type="button"
                                className="h-10 rounded-full px-4 text-sm"
                                onClick={() => handleCompleteTask(task._id)}
                              >
                                Mark complete
                              </Button>
                            )}

                            <Button
                              type="button"
                              variant="destructive"
                              className="h-10 rounded-full px-4 text-sm"
                              onClick={() => handleDeleteTask(task._id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default Tasks;
