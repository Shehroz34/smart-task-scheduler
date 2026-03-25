import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import heroImage from "@/assets/hero.png";
import api from "@/api/axios";
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
import { Separator } from "@/components/ui/separator";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const token = response.data.token;
      localStorage.setItem("token", token);

      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(184,198,255,0.28),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,211,166,0.28),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(244,247,251,0.98))]" />

      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border/70 bg-background/80 shadow-[0_30px_100px_-40px_rgba(15,23,42,0.45)] backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative flex flex-col justify-between gap-10 border-b border-border/70 p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-12">
          <div className="space-y-6">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
              Smart Scheduler
            </Badge>

            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Plan focused work around the time you actually have.
              </h1>
              <p className="max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
                Turn task duration, deadlines, and availability into a schedule
                that feels realistic instead of aspirational.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/70 bg-white/70 py-0 shadow-none">
              <CardContent className="space-y-1 px-5 py-4">
                <p className="text-2xl font-semibold text-foreground">1</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Workflow
                </p>
                <p className="text-sm text-muted-foreground">
                  Tasks, priorities, and schedules stay in one place.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-white/70 py-0 shadow-none">
              <CardContent className="space-y-1 px-5 py-4">
                <p className="text-2xl font-semibold text-foreground">24/7</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Visibility
                </p>
                <p className="text-sm text-muted-foreground">
                  See what is on track, split, or at risk before deadlines slip.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 bg-white/70 py-0 shadow-none">
              <CardContent className="space-y-1 px-5 py-4">
                <p className="text-2xl font-semibold text-foreground">100%</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Adjustable
                </p>
                <p className="text-sm text-muted-foreground">
                  Update availability and replan without rebuilding everything.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-[#f3f5f8] p-3">
            <img
              src={heroImage}
              alt="Smart Scheduler preview"
              className="h-64 w-full rounded-[1.1rem] object-cover object-center sm:h-72"
            />
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <Card className="w-full max-w-md border-border/70 bg-background/90 py-0 shadow-none">
            <CardHeader className="space-y-3 px-8 pt-8">
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
                Welcome back
              </Badge>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-semibold text-foreground">
                  Sign in to your workspace
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  Access your dashboard, tasks, and scheduling plan.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-8 pb-8">
              {error && (
                <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
                  <AlertTitle>Unable to sign in</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11 rounded-xl bg-background"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <span className="text-xs text-muted-foreground">
                      Keep your session secure
                    </span>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 rounded-xl bg-background"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-11 w-full rounded-xl text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Separator className="flex-1" />
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    New here
                  </span>
                  <Separator className="flex-1" />
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  Create an account to start building realistic schedules from
                  your task list and working hours.
                </p>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 w-full rounded-xl text-sm"
                >
                  <Link to="/register">Create an account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

export default Login;
