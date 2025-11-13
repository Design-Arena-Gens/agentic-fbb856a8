import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-slate-50 to-purple-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 dark:text-slate-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-600 dark:text-blue-300">
            Self Study
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/login"
            className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:hover:border-blue-500"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-blue-600 px-5 py-2 text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
          >
            Join now
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24">
        <section className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-600 shadow-sm ring-1 ring-blue-500/10 dark:bg-slate-900/60 dark:text-blue-300">
              AI-guided study partner
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-slate-900 sm:text-5xl dark:text-white">
              Turn every PDF into a personalised study plan you can actually finish.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
              Self Study analyses your textbooks and notes, highlights the key concepts, and
              builds a deadline-driven roadmap with daily goals, reminders, and progress analytics.
              Stay on track across every device.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
              <Link
                href="/register"
                className="rounded-full bg-blue-600 px-6 py-3 text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
              >
                Start in minutes
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-200 px-6 py-3 text-slate-700 transition hover:border-blue-200 hover:text-blue-600 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500"
              >
                Already a member?
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-blue-600/20 ring-1 ring-blue-500/5 dark:border-slate-800 dark:bg-slate-900">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                    Sample plan
                  </h3>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600">
                    82% complete
                  </span>
                </div>
                <div className="space-y-3">
                  {["Key concepts", "Adaptive pacing", "Daily reminders"].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-600/10" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {item}
                          </p>
                          <p className="text-xs text-slate-500">
                            Automated support built from your own material.
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Upload & analyse",
              description:
                "Drop in your PDF notes or textbooks and capture summaries with AI-powered highlighting.",
            },
            {
              title: "Plan your sprint",
              description:
                "Choose a deadline and get balanced daily goals with reminders that sync across devices.",
            },
            {
              title: "Track progress",
              description:
                "Stay accountable with dashboards, completion rates, and reflections that inform tomorrow’s plan.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-500/10 dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {feature.description}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
