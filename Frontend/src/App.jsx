import { useState } from 'react'
import Finance from './components/Finance'
import Food from './components/Food'
import Sleep from './components/Sleep'
import Study from './components/Study'

const tabs = ["Overview", "Finance", "Food", "Sleep", "Study"]

const mockToday = {
  finance: {
    spent: 1200,
    budget: 2000,
    categories: [
      { name: "Food", value: 450 },
      { name: "Transport", value: 150 },
      { name: "Subscriptions", value: 200 },
      { name: "Other", value: 400 }
    ]
  },
  food: {
    calories: 1850,
    protein: 96,
    water: 7
  },
  sleep: {
    hours: 7.5,
    quality: "Good"
  },
  study: {
    hours: 4.25,
    focusScore: 82
  }
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-[0_0_40px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</div>
      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-semibold text-zinc-50">{value}</div>
        {accent && (
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
            {accent}
          </span>
        )}
      </div>
      {sub && <div className="mt-1 text-[11px] text-zinc-500">{sub}</div>}
    </div>
  )
}

function Ring({ percent, label }) {
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="flex items-center gap-3">
      <svg width="48" height="48" className="drop-shadow-[0_0_20px_rgba(147,197,253,0.35)]">
        <circle
          cx="24"
          cy="24"
          r={radius}
          className="stroke-zinc-800"
          strokeWidth="5"
          fill="transparent"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          className="stroke-sky-400"
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div>
        <div className="text-xs font-medium text-zinc-300">{label}</div>
        <div className="text-[11px] text-zinc-500">{percent}% of target</div>
      </div>
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState("Overview")

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-black to-[#020617] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.25)_0,transparent_50%),radial-gradient(circle_at_90%_20%,rgba(236,72,153,0.24)_0,transparent_55%),radial-gradient(circle_at_40%_100%,rgba(16,185,129,0.28)_0,transparent_55%)] opacity-70" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 pb-4 pt-2 sm:pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-400 to-emerald-400 text-lg font-semibold text-black shadow-[0_0_25px_rgba(56,189,248,0.7)]">
              PT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-medium tracking-[0.18em] text-zinc-400 sm:text-xs">
                  PERSONAL TRACKER
                </h1>
                <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium text-emerald-400">
                  LIVE
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Finance · Food · Sleep · Study in one place
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <div className="hidden items-center gap-2 rounded-full border border-zinc-800/60 bg-zinc-900/60 px-3 py-1.5 shadow-[0_0_30px_rgba(0,0,0,0.65)] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              <span className="font-medium text-zinc-300">Sync</span>
              <span className="text-[11px] text-zinc-500">Notion · WhatsApp</span>
            </div>
            <button className="rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-[11px] font-medium text-zinc-300 shadow-[0_0_18px_rgba(0,0,0,0.6)] transition hover:border-zinc-700 hover:bg-zinc-900">
              Today · 07 Dec
            </button>
          </div>
        </header>

        <nav className="mb-4 flex gap-2 overflow-x-auto rounded-2xl border border-zinc-800/70 bg-gradient-to-r from-zinc-950/90 via-zinc-950/60 to-zinc-950/80 p-1.5 text-xs shadow-[0_0_35px_rgba(0,0,0,0.8)] sm:mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex items-center gap-1 rounded-2xl px-3.5 py-1.5 font-medium transition ${
                activeTab === tab
                  ? "bg-zinc-100 text-zinc-900 shadow-[0_0_20px_rgba(250,250,250,0.4)]"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {tab}
              {tab === "Finance" && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
              )}
              {tab === "Study" && (
                <span className="rounded-full bg-indigo-500/15 px-1.5 py-[1px] text-[9px] text-indigo-300">
                  focus
                </span>
              )}
            </button>
          ))}
        </nav>

        <main className="grid flex-1 gap-4 pb-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-5">
          <section className="flex flex-col gap-4">
            {/* Overview top card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-[0_0_40px_rgba(0,0,0,0.9)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-50">
                    Today overview
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    High level snapshot across money, health and focus.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                  <Ring percent={64} label="Finance budget" />
                  <Ring percent={72} label="Calories target" />
                  <Ring percent={82} label="Study focus" />
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <StatCard
                  label="Finance · spent / budget"
                  value={`₹${mockToday.finance.spent.toLocaleString()} / ₹${mockToday.finance.budget.toLocaleString()}`}
                  sub="Swipe down in WhatsApp · auto logs from messages"
                  accent="Notion synced"
                />
                <StatCard
                  label="Food · calories"
                  value={`${mockToday.food.calories} kcal`}
                  sub={`Protein ${mockToday.food.protein} g · Water ${mockToday.food.water} glasses`}
                  accent="Log with one message"
                />
                <StatCard
                  label="Sleep & Study"
                  value={`${mockToday.sleep.hours} h · ${mockToday.study.hours} h`}
                  sub={`Sleep ${mockToday.sleep.quality} · Focus score ${mockToday.study.focusScore}/100`}
                  accent="Auto from routine"
                />
              </div>
            </div>

            {/* Tab-specific content below the overview card */}
            {activeTab === 'Overview' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-[0_0_36px_rgba(0,0,0,0.85)]">
                <div className="flex items-center justify-between text-xs">
                  <h3 className="font-medium text-zinc-200">Notion sync</h3>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] text-[10px] text-emerald-400">
                    Connected
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Every log becomes a clean Notion row: date, tags, values.
                </p>
                <ul className="mt-3 space-y-2 text-[11px] text-zinc-400">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    Finance database · `transactions`
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Health database · `daily-metrics`
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Study database · `sessions`
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-[0_0_36px_rgba(0,0,0,0.85)]">
                <div className="flex items-center justify-between text-xs">
                  <h3 className="font-medium text-zinc-200">WhatsApp commands</h3>
                  <span className="rounded-full bg-sky-500/10 px-2 py-[2px] text-[10px] text-sky-400">
                    Prototype
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Log your day by just sending messages to your bot.
                </p>
                <div className="mt-3 space-y-1.5 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-[11px] text-zinc-300">
                  <div className="flex gap-2">
                    <span className="rounded-md bg-emerald-500/10 px-1.5 text-[10px] text-emerald-300">
                      You
                    </span>
                    <span>spent 220 on food</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-md bg-sky-500/10 px-1.5 text-[10px] text-sky-300">
                      Bot
                    </span>
                    <span>Logged · Finance › Food · ₹220</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-md bg-emerald-500/10 px-1.5 text-[10px] text-emerald-300">
                      You
                    </span>
                    <span>sleep 7.3h / study 3.8h</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-md bg-sky-500/10 px-1.5 text-[10px] text-sky-300">
                      Bot
                    </span>
                    <span>Updated · Sleep + Study dashboard</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {activeTab === 'Finance' && <Finance finance={mockToday.finance} />}
            {activeTab === 'Food' && <Food food={mockToday.food} />}
            {activeTab === 'Sleep' && <Sleep sleep={mockToday.sleep} />}
            {activeTab === 'Study' && <Study study={mockToday.study} />}
          </section>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-[0_0_36px_rgba(0,0,0,0.85)]">
              <div className="flex items-center justify-between text-xs">
                <h3 className="font-medium text-zinc-200">Today focus</h3>
                <span className="text-[11px] text-zinc-500">Quick actions</span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Use shortcuts to update trackers without opening the app.
              </p>
              <div className="mt-3 grid gap-2 text-[11px] sm:grid-cols-2">
                <button className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-left text-zinc-300 transition hover:border-emerald-500/60 hover:bg-emerald-500/5">
                  <span>
                    Add quick expense
                    <span className="block text-[10px] text-zinc-500 group-hover:text-emerald-300">
                      DM bot: "spent 120 coffee"
                    </span>
                  </span>
                  <span className="rounded-md bg-emerald-500/15 px-1.5 py-[1px] text-[9px] text-emerald-300">
                    Finance
                  </span>
                </button>
                <button className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-left text-zinc-300 transition hover:border-sky-500/60 hover:bg-sky-500/5">
                  <span>
                    Log meals
                    <span className="block text-[10px] text-zinc-500 group-hover:text-sky-300">
                      "food 850kcal · 40g protein"
                    </span>
                  </span>
                  <span className="rounded-md bg-sky-500/15 px-1.5 py-[1px] text-[9px] text-sky-300">
                    Food
                  </span>
                </button>
                <button className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-left text-zinc-300 transition hover:border-violet-500/60 hover:bg-violet-500/5">
                  <span>
                    Close day recap
                    <span className="block text-[10px] text-zinc-500 group-hover:text-violet-300">
                      "recap today" → summary on WhatsApp + Notion
                    </span>
                  </span>
                  <span className="rounded-md bg-violet-500/15 px-1.5 py-[1px] text-[9px] text-violet-300">
                    Summary
                  </span>
                </button>
                <button className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-left text-zinc-300 transition hover:border-amber-500/60 hover:bg-amber-500/5">
                  <span>
                    Study sprint
                    <span className="block text-[10px] text-zinc-500 group-hover:text-amber-200">
                      "study 90m deep work"
                    </span>
                  </span>
                  <span className="rounded-md bg-amber-500/15 px-1.5 py-[1px] text-[9px] text-amber-200">
                    Focus
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-[11px] text-zinc-400 shadow-[0_0_40px_rgba(0,0,0,0.95)]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-zinc-200">Integration notes</h3>
                <span className="rounded-full bg-zinc-900 px-2 py-[2px] text-[9px] text-zinc-500">
                  Backend · Express + Mongo
                </span>
              </div>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>Backend route to receive WhatsApp webhook, parse message.</li>
                <li>Normalize into event (finance / food / sleep / study).</li>
                <li>Store raw + processed events in MongoDB.</li>
                <li>Push structured row into Notion databases via API.</li>
                <li>Expose `/api/today` endpoint → feeds this dashboard.</li>
              </ol>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}

export default App
