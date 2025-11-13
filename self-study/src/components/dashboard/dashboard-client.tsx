"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NotificationManager } from "@/components/notification-manager";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { ChartBarIcon, DocumentArrowUpIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export type DashboardDocument = {
  id: string;
  title: string;
  originalName: string;
  summary: string;
  highlights: { snippet: string; score: number }[];
  pages: number;
  createdAt: string;
};

export type DashboardGoal = {
  id: string;
  dayNumber: number;
  date: string;
  startIndex: number;
  endIndex: number;
  contentPreview: string;
  wordCount: number;
  completed: boolean;
  reflections?: Record<string, unknown> | null;
};

export type DashboardProgressEntry = {
  id: string;
  createdAt: string;
  notes?: string | null;
  mood?: string | null;
  mastery?: number | null;
  goalId?: string | null;
};

export type DashboardPlan = {
  id: string;
  name: string;
  documentId: string;
  totalDays: number;
  startDate: string;
  deadline: string;
  dailyWordCount: number;
  summary: string;
  keyConcepts: string[];
  completedGoals: number;
  completionRate: number;
  dailyGoals: DashboardGoal[];
  progressEntries: DashboardProgressEntry[];
  document: Pick<
    DashboardDocument,
    "id" | "title" | "summary" | "highlights" | "pages"
  >;
};

type DashboardClientProps = {
  userName?: string | null;
  documents: DashboardDocument[];
  plans: DashboardPlan[];
};

type UploadState = {
  status: "idle" | "loading" | "error" | "success";
  message?: string;
};

type PlanState = {
  status: "idle" | "loading" | "error" | "success";
  message?: string;
};

export const DashboardClient = ({
  documents,
  plans,
  userName,
}: DashboardClientProps) => {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState(
    plans[0]?.id ?? null,
  );
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const [planState, setPlanState] = useState<PlanState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();
  const [progressNotes, setProgressNotes] = useState("");
  const [progressMood, setProgressMood] = useState("");
  const [progressMastery, setProgressMastery] = useState<number | undefined>();
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null,
    [plans, selectedPlanId],
  );

  const nextGoalDate = useMemo(() => {
    if (!selectedPlan) return null;
    const upcoming = selectedPlan.dailyGoals.find((goal) => !goal.completed);
    if (!upcoming) return null;
    return new Date(upcoming.date);
  }, [selectedPlan]);

  const handleUploadDocument: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setUploadState({
        status: "error",
        message: "Choose a PDF file before uploading.",
      });
      return;
    }

    setUploadState({ status: "loading" });
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message ?? "Upload failed");
      }

      setUploadState({
        status: "success",
        message: "Document processed successfully.",
      });
      form.reset();
      startTransition(() => router.refresh());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to upload document.";
      setUploadState({ status: "error", message });
    }
  };

  const handleCreatePlan: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      documentId: formData.get("documentId"),
      planName: formData.get("planName"),
      deadline: formData.get("deadline"),
    };

    if (
      typeof payload.documentId !== "string" ||
      typeof payload.planName !== "string" ||
      typeof payload.deadline !== "string"
    ) {
      setPlanState({
        status: "error",
        message: "Fill out the plan form completely.",
      });
      return;
    }

    setPlanState({ status: "loading" });
    try {
      const response = await fetch("/api/study-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message ?? "Plan creation failed");
      }
      setPlanState({ status: "success", message: "Study plan ready!" });
      form.reset();
      startTransition(() => router.refresh());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create plan.";
      setPlanState({ status: "error", message });
    }
  };

  const toggleGoalCompletion = async (goal: DashboardGoal) => {
    if (!selectedPlan) return;
    try {
      await fetch(`/api/study-plans/${selectedPlan.id}/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !goal.completed }),
      });
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
    }
  };

  const submitProgressEntry = async () => {
    if (!selectedPlan) return;
    try {
      await fetch(`/api/study-plans/${selectedPlan.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: progressNotes.length > 0 ? progressNotes : undefined,
          mood: progressMood.length > 0 ? progressMood : undefined,
          mastery: progressMastery,
        }),
      });
      setProgressNotes("");
      setProgressMood("");
      setProgressMastery(undefined);
      startTransition(() => router.refresh());
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-500">
              Self Study
            </p>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Welcome back{userName ? `, ${userName}` : ""} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl grow flex-col gap-6 px-6 py-8">
        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Upload materials</CardTitle>
              <CardDescription>
                Add your textbook or class notes as a PDF to extract the core concepts automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleUploadDocument}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Select PDF file
                    </label>
                    <Input type="file" name="file" accept="application/pdf" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Optional title
                    </label>
                    <Input name="title" placeholder="e.g. Calculus I, Chapter 2" />
                  </div>
                </div>
                <CardFooter className="justify-between p-0">
                  <div className="text-sm text-slate-500">
                    AI extracts highlights, concepts, and a summary automatically.
                  </div>
                  <Button type="submit" isLoading={uploadState.status === "loading"}>
                    <DocumentArrowUpIcon className="mr-2 h-4 w-4" />
                    Process PDF
                  </Button>
                </CardFooter>
              </form>
              {uploadState.status !== "idle" && (
                <p
                  className={cn(
                    "text-sm",
                    uploadState.status === "error"
                      ? "text-red-500"
                      : "text-emerald-600",
                  )}
                >
                  {uploadState.message}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick metrics</CardTitle>
              <CardDescription>
                Overview of your study library and plan progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4 text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
                <span className="text-sm font-medium">Uploaded texts</span>
                <span className="text-2xl font-semibold">{documents.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
                <span className="text-sm font-medium">Active plans</span>
                <span className="text-2xl font-semibold">{plans.length}</span>
              </div>
              {selectedPlan && (
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {selectedPlan.name}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                    {selectedPlan.completedGoals} / {selectedPlan.dailyGoals.length} goals complete
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${selectedPlan.completionRate}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Deadline: {format(new Date(selectedPlan.deadline), "PP")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Create study plan</CardTitle>
              <CardDescription>
                Choose a document and define your target completion date. We&apos;ll split it into daily focus blocks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreatePlan}>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Select material
                  </label>
                  <select
                    name="documentId"
                    required
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      -- Select a document --
                    </option>
                    {documents.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} ({doc.pages} pages)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Plan name
                  </label>
                  <Input name="planName" placeholder="Midterm exam sprint" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Completion deadline
                  </label>
                  <Input type="date" name="deadline" required />
                </div>
                <CardFooter className="justify-between p-0">
                  <div className="text-sm text-slate-500">
                    Daily workloads balance automatically.
                  </div>
                  <Button type="submit" isLoading={planState.status === "loading"}>
                    Build plan
                  </Button>
                </CardFooter>
              </form>
              {planState.status !== "idle" && (
                <p
                  className={cn(
                    "text-sm",
                    planState.status === "error" ? "text-red-500" : "text-emerald-600",
                  )}
                >
                  {planState.message}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Your documents</CardTitle>
              <CardDescription>
                Summaries and highlights from each upload.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {documents.length === 0 && (
                <p className="text-sm text-slate-500">
                  Upload a PDF to see AI-powered insights here.
                </p>
              )}
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:hover:border-blue-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {doc.title}
                      </h3>
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        {doc.pages} pages · uploaded{" "}
                        {formatDistanceToNow(new Date(doc.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                    {doc.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {doc.highlights.slice(0, 3).map((highlight, index) => (
                      <span
                        key={`${doc.id}-highlight-${index}`}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600 dark:bg-blue-900/40 dark:text-blue-200"
                      >
                        {highlight.snippet.slice(0, 80)}…
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {selectedPlan && (
          <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Study plan tracker</CardTitle>
                <CardDescription>
                  Tick off daily goals as you work through {selectedPlan.document.title}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {selectedPlan.name}
                    </p>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {selectedPlan.completedGoals} complete · {selectedPlan.dailyGoals.length} total
                    </p>
                  </div>
                  <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
                    {selectedPlan.completionRate}% progress
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {selectedPlan.dailyGoals.map((goal) => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => toggleGoalCompletion(goal)}
                      className={cn(
                        "w-full rounded-xl border p-4 text-left transition hover:shadow-md focus:outline-none",
                        goal.completed
                          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-600/40 dark:bg-emerald-900/20"
                          : "border-slate-200 hover:border-blue-300 dark:border-slate-700 dark:hover:border-blue-600/60",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            Day {goal.dayNumber}: {format(new Date(goal.date), "PP")}
                          </p>
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            {goal.wordCount} words
                          </p>
                        </div>
                        {goal.completed ? (
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-300">
                            Completed ✓
                          </span>
                        ) : (
                          <span className="text-sm text-blue-500">Mark done →</span>
                        )}
                      </div>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                        {goal.contentPreview}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Concept focus</CardTitle>
                  <CardDescription>
                    Core ideas the AI recommends prioritising from this material.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlan.keyConcepts.map((concept) => (
                      <span
                        key={concept}
                        className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-200"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                    {selectedPlan.summary}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance dashboard</CardTitle>
                  <CardDescription>
                    Log how each session felt to spot patterns in your study habits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Recent reflections
                    </p>
                    {selectedPlan.progressEntries.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">
                        Track your first study session to build momentum.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-3">
                        {selectedPlan.progressEntries.slice(0, 5).map((entry) => (
                          <li key={entry.id} className="rounded-lg bg-slate-100/60 p-3 text-sm dark:bg-slate-800/60">
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              {format(new Date(entry.createdAt), "PPpp")}
                            </p>
                            {entry.notes && (
                              <p className="mt-2 text-slate-600 dark:text-slate-300">{entry.notes}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                              {entry.mood && <span>Mood: {entry.mood}</span>}
                              {typeof entry.mastery === "number" && (
                                <span>Mastery: {entry.mastery}%</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Textarea
                      placeholder="How did today go? Capture wins, blockers, or questions."
                      value={progressNotes}
                      onChange={(event) => setProgressNotes(event.target.value)}
                    />
                    <Input
                      placeholder="Mood (focused, distracted, confident...)"
                      value={progressMood}
                      onChange={(event) => setProgressMood(event.target.value)}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="Mastery estimate %"
                      value={progressMastery ?? ""}
                      onChange={(event) =>
                        setProgressMastery(
                          event.target.value.length === 0
                            ? undefined
                            : Number.parseInt(event.target.value, 10),
                        )
                      }
                    />
                    <Button type="button" onClick={submitProgressEntry} disabled={isPending}>
                      <ChartBarIcon className="mr-2 h-4 w-4" />
                      Log session
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <NotificationManager planName={selectedPlan.name} nextGoalDate={nextGoalDate} />
            </div>
          </section>
        )}

        <section>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Switch active plan
          </label>
          <div className="flex flex-wrap gap-2">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  selectedPlan?.id === plan.id
                    ? "border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-500"
                    : "border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300",
                )}
              >
                {plan.name}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
