import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Plus, Trash2, Edit2, Download, Calendar } from "lucide-react";
import { getAuthToken } from "../middlewares/Auth";
import Nav from "./Nav";

const API_BASE = "http://localhost:3000/api/other/habits";

function formatDate(d) {
  if (!d) return "";
  try {
    // Handle MongoDB extended JSON forms and ObjectId timestamps.
    let date = null;
    if (d && typeof d === "object") {
      if (d.$date) {
        date = new Date(d.$date);
      } else if (d.$oid) {
        const hex = String(d.$oid);
        if (/^[0-9a-fA-F]{24}$/.test(hex))
          date = new Date(parseInt(hex.substring(0, 8), 16) * 1000);
      }
    } else if (typeof d === "string" && /^[0-9a-fA-F]{24}$/.test(d)) {
      // plain ObjectId hex string
      date = new Date(parseInt(d.substring(0, 8), 16) * 1000);
    } else {
      date = d instanceof Date ? d : new Date(d);
    }
    if (!date || Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  } catch (e) {
    return "";
  }
}

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Render a reminder value into a human-friendly string. Moved to module scope
// so the memoized `HabitItem` can call it without scope issues.
function renderReminder(rem) {
  if (!rem) return "—";
  if (typeof rem === "string") return rem;
  if (typeof rem === "object") {
    if (typeof rem.enabled !== "undefined") {
      if (!rem.enabled) return "No reminder";
      if (rem.time) return rem.time;
      return "Reminder set";
    }
    return JSON.stringify(rem);
  }
  return String(rem);
}

// Memoized list item to avoid re-renders when parent state changes
const HabitItem = React.memo(function HabitItem({ h, onEdit, onRemove, onToggle, onAddDate }) {
  return (
    <div
      key={h._id || h.id}
      className="rounded-xl p-6 bg-[#0f1724] flex items-center justify-between"
    >
      <div>
        <div className="text-lg font-semibold">{h.name}</div>
        <div className="mt-2 text-sm text-gray-400 flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>{formatDate(h.createdAt || h._id || "") || "—"}</span>
          <span className="text-xs text-gray-500">{h.category} • {h.frequency}</span>
          <span className="ml-2 px-2 py-1 rounded text-xs text-gray-300 bg-[#071428]">{renderReminder(h.reminder)}</span>
        </div>
        {h.note && (<div className="mt-3 text-sm text-gray-400 italic">{h.note}</div>)}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-[#071428]">Target</span>
            <span className="font-medium">{h.targetCount ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-[#071428]">Streak</span>
            <span className="font-medium">{h.currentStreak ?? 0}</span>
            <span className="text-xs text-gray-500">(max {h.longestStreak ?? 0})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group inline-block">
              <button
                onClick={() => onToggle(h._id || h.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${h.done ? "bg-green-500 hover:bg-green-400 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-200"}`}
              >
                {h.done ? "Done" : "Mark done"}
              </button>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">{h.done ? "Mark as not done" : "Mark as done"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-blue-400">{h.targetCount}{h.frequency === "daily" ? "" : ""}</div>

        <div className="relative group inline-block">
          <button onClick={() => onEdit(h)} className="p-2 bg-gray-400 hover:bg-blue-600 rounded-lg transition shadow-lg"><Edit2 size={18} /></button>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">Edit record</span>
        </div>

        <div className="relative group inline-block">
          <button onClick={() => onRemove(h._id || h.id)} className="p-2 bg-red-900 hover:bg-red-700 rounded-lg transition shadow-lg"><Trash2 size={18} /></button>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">Delete record</span>
        </div>
      </div>
    </div>
  );
});

export default function Habit() {
  
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "",
    category: "other",
    frequency: "daily",
    targetCount: 1,
    currentStreak: 0,
    longestStreak: 0,
    done: false,
    reminder: "",
    note: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    start: new Date().toISOString().slice(0, 10),
    end: getTomorrowDate(),
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [hasMore, setHasMore] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Simple in-memory cache: url -> {ts, data}
  const cache = useRef(new Map());
  const ongoingFetch = useRef(null);

  useEffect(() => {
    fetchList();
  }, []);

  // Debounce filter changes so typing doesn't spam requests
  const filtersInit = useRef(true);
  useEffect(() => {
    if (filtersInit.current) {
      filtersInit.current = false;
      return;
    }
    const t = setTimeout(() => fetchList(false), 350);
    return () => clearTimeout(t);
  }, [filters.name, filters.start, filters.end]);

  // Fetch with pagination, cache, and abort support. If append true, append to list (for Load more)
  async function fetchList(ignoreFilters = false, { page: forPage = 1, append = false } = {}) {
    setLoading(true);
    setError(null);
    try {
      let params = new URLSearchParams();
      if (!ignoreFilters) {
        if (filters.name) params.set("name", filters.name);
        if (filters.start) params.set("start", filters.start);
        if (filters.end) params.set("end", filters.end);
      }
      params.set("page", forPage);
      params.set("limit", limit);
      const url = `${API_BASE}?${params.toString()}`;

      // Simple cache TTL of 20s
      const now = Date.now();
      const cached = cache.current.get(url);
      if (cached && now - cached.ts < 20000) {
        const data = cached.data;
        const items = Array.isArray(data) ? data : (data && data.data) || (data && data.habits) || [];
        setHabits((prev) => (append ? [...prev, ...items] : items));
        setHasMore(items.length >= limit);
        setLoading(false);
        return;
      }

      // Abort previous fetch
      if (ongoingFetch.current) {
        try { ongoingFetch.current.abort(); } catch (e) {}
      }
      const ac = new AbortController();
      ongoingFetch.current = ac;

      const res = await authFetch(url, { signal: ac.signal });
      const ct = res.headers.get("content-type") || "";
      let data = null;
      if (ct.includes("application/json")) data = await res.json().catch(() => null);
      else data = await res.text().catch(() => null);

      if (!res.ok) {
        const msg = typeof data === "string" ? data : data && data.message ? data.message : `Status ${res.status}`;
        setError(msg);
        if (!append) setHabits([]);
        setLoading(false);
        return;
      }

      const items = Array.isArray(data) ? data : (data && data.data) || (data && data.habits) || [];
      cache.current.set(url, { ts: Date.now(), data });
      setHabits((prev) => (append ? [...prev, ...items] : items));
      setHasMore(items.length >= limit);
      setPage(forPage);
    } catch (e) {
      if (e && e.name === 'AbortError') {
        // cancelled, ignore
      } else {
        setError(e.message || String(e));
      }
    } finally {
      setLoading(false);
      ongoingFetch.current = null;
    }
  }

  function authFetch(url, opts = {}) {
    const token = getAuthToken();
    const headers = { ...(opts.headers || {}) };
    if (token)
      headers["Authorization"] = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
    console.debug("authFetch token present:", !!token, "url:", url);
    // include credentials for cookie-based sessions
    // add a simple timeout wrapper
    const controller = opts.signal ? null : new AbortController();
    const signal = opts.signal || (controller && controller.signal);
    const fetchPromise = fetch(url, { ...opts, headers, credentials: "include", signal });
    if (!controller) return fetchPromise;
    const timeout = 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    return fetchPromise.finally(() => clearTimeout(timeoutId));
  }

  async function saveHabit(e) {
    e && e.preventDefault();
    // Build payload and normalize reminder into expected object shape
    const reminderPayload =
      form.reminder && String(form.reminder).trim()
        ? { enabled: true, time: String(form.reminder).trim() }
        : { enabled: false };

    const payload = {
      ...form,
      targetCount: Number(form.targetCount || 0),
      currentStreak: Number(form.currentStreak || 0),
      longestStreak: Number(form.longestStreak || 0),
      done: !!form.done,
      reminder: reminderPayload,
    };
    try {
      // optimistic UI: for create, we just reload first page after success
      const res = editingId
        ? await authFetch(`${API_BASE}/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await authFetch(API_BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) throw new Error("Save failed");
      // clear relevant cache to ensure fresh data
      cache.current.clear();
      await fetchList(false, { page: 1, append: false });
      setForm({
        name: "",
        category: "other",
        frequency: "daily",
        targetCount: 1,
        currentStreak: 0,
        longestStreak: 0,
        done: false,
        reminder: "",
        note: "",
      });
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      alert(err.message);
    }
  }

  function editHabit(h) {
    setEditingId(h._id || h.id || null);
    let remVal = "";
    if (h.reminder) {
      if (typeof h.reminder === "object") remVal = h.reminder.time || "";
      else remVal = String(h.reminder);
    }
    setForm({
      name: h.name || "",
      category: h.category || "other",
      frequency: h.frequency || "daily",
      targetCount: h.targetCount || 1,
      currentStreak: h.currentStreak || 0,
      longestStreak: h.longestStreak || 0,
      done: !!h.done,
      reminder: remVal,
      note: h.note || "",
    });
    // make the form visible when editing
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeHabit(id) {
    if (!confirm("Delete this habit?")) return;
    // optimistic: remove locally first
    const prev = habits;
    setHabits((cur) => cur.filter((x) => (x._id || x.id) !== id));
    try {
      const res = await authFetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error('Delete failed');
      cache.current.clear();
      // ensure list is fresh
      await fetchList(false, { page: 1, append: false });
    } catch (e) {
      // revert on error
      setHabits(prev);
      setError(e.message || String(e));
    }
  }

  async function toggleDone(id) {
    // optimistic toggle
    setHabits((cur) => cur.map((h) => {
      if ((h._id || h.id) === id) return { ...h, done: !h.done };
      return h;
    }));
    try {
      const res = await authFetch(`${API_BASE}/${id}/toggle`, { method: "PATCH" });
      if (!res.ok) throw new Error('Toggle failed');
      cache.current.clear();
    } catch (e) {
      // revert by refetching
      await fetchList(false, { page: 1, append: false });
      setError(e.message || String(e));
    }
  }

  async function addCompletedDate(id) {
    const date = prompt(
      "Completed date (YYYY-MM-DD)",
      new Date().toISOString().slice(0, 10),
    );
    if (!date) return;
    try {
      const res = await authFetch(`${API_BASE}/${id}/completed-date`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) throw new Error('Add date failed');
      cache.current.clear();
      await fetchList(false, { page: 1, append: false });
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  async function exportHabits(download = false) {
    const start = prompt("Start date (YYYY-MM-DD)");
    const end = prompt("End date (YYYY-MM-DD)");
    if (!start || !end) return;
    const url = `${API_BASE}/export?start=${start}&end=${end}${download ? "&download=1" : ""}`;
    if (download) {
      window.location = url;
    } else {
      const res = await authFetch(url);
      const text = await res.text();
      const w = window.open("", "_blank");
      w.document.write(`<pre>${escapeHtml(text)}</pre>`);
    }
  }

  function escapeHtml(s) {
    return s.replace(
      /[&<>\"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '\"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  const safeHabits = useMemo(() => (Array.isArray(habits) ? habits : []), [habits]);

  const stats = useMemo(() => safeHabits.reduce((acc, h) => {
    acc.total += 1;
    if (h.done) acc.done += 1;
    acc.byCategory[h.category || "other"] = (acc.byCategory[h.category || "other"] || 0) + 1;
    acc.streakSum += h.currentStreak || 0;
    if ((h.longestStreak || 0) > acc.longest) acc.longest = h.longestStreak;
    return acc;
  }, { total: 0, done: 0, byCategory: {}, streakSum: 0, longest: 0 }), [safeHabits]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1020] via-[#161026] to-[#3b1050] text-gray-100 habit-root">
		<style>{`
                .habit-root ::selection { background: #1213138a; color: #2ee0a8; }
                .habit-root ::-moz-selection { background: #0f0f0f; color: #a82dd4; }
                /* subtle focused-selection shadow for modern look */
                .habit-root ::selection { box-shadow: 0 0 0 3px rgba(14,165,255,0.12); }
            `}</style>
      <Nav />
      <div className="max-w-6xl mx-auto p-8">
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Habits Dashboard
              </h1>
              <p className="mt-2 text-gray-300">
                Track your habits, streaks and progress with clarity
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl p-6 bg-[#0f1724] shadow-lg">
              <div className="text-sm text-gray-400">Total Habits</div>
              <div className="text-4xl font-bold text-blue-400 mt-3">
                {stats.total}
              </div>
            </div>
            <div className="rounded-xl p-6 bg-[#0f1724] shadow-lg">
              <div className="text-sm text-gray-400">Completed today</div>
              <div className="text-4xl font-bold text-pink-400 mt-3">
                {stats.done}
              </div>
            </div>
            <div className="rounded-xl p-6 bg-[#0f1724] shadow-lg">
              <div className="text-sm text-gray-400">Categories</div>
              <div className="text-4xl font-bold text-purple-400 mt-3">
                {Object.keys(stats.byCategory).length}
              </div>
            </div>
          </div>
        </header>

        <section className="mb-6 bg-transparent">
          <div className="flex flex-wrap gap-4 items-center">
            {/* new create button */}
            <div className="relative group inline-block">
              <button
                onClick={() => setShowForm((s) => !s)}
                className="px-6 py-3
               bg-blue-600 hover:bg-blue-500
               text-white rounded-lg font-semibold
               transition-all duration-200
               shadow-lg hover:shadow-blue-500/50
               hover:-translate-y-0.5"
              >
                + Add Record
              </button>

              {/* Tooltip */}
              <span
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
               whitespace-nowrap rounded-md bg-black
               px-3 py-1 text-xs text-white
               opacity-0 group-hover:opacity-100
               transition-opacity duration-200"
              >
                Add new record
              </span>
            </div>

            {/* export button */}
            <div className="relative group inline-block">
              <button
                onClick={() => exportHabits(true)}
                className="px-6 py-3
               bg-green-500 hover:bg-green-400
               text-white rounded-lg font-semibold
               transition-all duration-200
               shadow-lg hover:shadow-green-500/50
               hover:-translate-y-0.5"
              >
                ⬇ Export
              </button>

              {/* Tooltip */}
              <span
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
               whitespace-nowrap rounded-md bg-black
               px-3 py-1 text-xs text-white
               opacity-0 group-hover:opacity-100
               transition-opacity duration-200"
              >
                Export habits
              </span>
            </div>

            <div className="ml-auto flex gap-3">
              <input
                placeholder="Filter by name"
                value={filters.name}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, name: e.target.value }))
                }
                className="px-4 py-3 rounded-lg bg-[#0f1724] focus:outline-none"
              />
              <input
                type="date"
                value={filters.start}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, start: e.target.value }))
                }
                className="px-4 py-3 rounded-lg bg-[#0f1724]"
              />
              <input
                type="date"
                value={filters.end}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, end: e.target.value }))
                }
                className="px-4 py-3 rounded-lg bg-[#0f1724]"
              />
            </div>
          </div>
        </section>

        {showForm && (
          <section className="rounded-xl p-6 bg-[#0f1724] border border-[#22303a] mb-6">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">
              {editingId ? "Edit Record" : "+ New Record"}
            </h2>
            <form onSubmit={saveHabit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Name
                  </label>
                  <input
                    required
                    placeholder="Enter habit name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="px-4 py-3 rounded-lg bg-[#0b1620] w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    className="px-4 py-3 rounded-lg bg-[#0b1620] w-full"
                  >
                    <option value="health">Health</option>
                    <option value="productivity">Productivity</option>
                    <option value="learning">Learning</option>
                    <option value="social">Social</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Frequency
                  </label>
                  <select
                    value={form.frequency}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, frequency: e.target.value }))
                    }
                    className="px-4 py-3 rounded-lg bg-[#0b1620] w-full"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Reminder (HH:MM)
                  </label>
                  <input
                    placeholder="e.g. 07:30"
                    value={form.reminder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, reminder: e.target.value }))
                    }
                    className="px-4 py-3 rounded-lg bg-[#0b1620] w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Current Streak
                  </label>
                  <input
                    placeholder="0"
                    type="number"
                    min="0"
                    value={form.currentStreak}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, currentStreak: e.target.value }))
                    }
                    className="px-4 py-3 rounded-lg bg-[#0b1620] w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Longest Streak
                  </label>
                  <input
                    placeholder="0"
                    type="number"
                    min="0"
                    value={form.longestStreak}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, longestStreak: e.target.value }))
                    }
                    className="px-4 py-3 rounded-lg bg-[#0b1620] w-full"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Target Count
                  </label>
                  <input
                    placeholder="1"
                    type="number"
                    min="0"
                    value={form.targetCount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, targetCount: e.target.value }))
                    }
                    className="px-4 py-3 rounded-lg bg-[#0b1620] w-full"
                  />
                  <div className="mt-2">
                    <label
                      htmlFor="done"
                      className="inline-flex items-center gap-2 text-sm text-gray-300"
                    >
                      <input
                        id="done"
                        type="checkbox"
                        checked={!!form.done}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, done: e.target.checked }))
                        }
                        className="h-4 w-4"
                      />
                      <span>Done</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 rounded-lg"
                >
                  {editingId ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setForm({
                      name: "",
                      category: "other",
                      frequency: "daily",
                      targetCount: 1,
                      reminder: "",
                      note: "",
                    });
                    setEditingId(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <main className="space-y-6">
          {safeHabits.length === 0 && !loading ? (
            <div className="rounded-xl p-8 bg-[#0f1724] text-gray-400">No habits yet. Create one!</div>
          ) : (
            safeHabits.map((h) => (
              <HabitItem key={h._id || h.id} h={h} onEdit={editHabit} onRemove={removeHabit} onToggle={toggleDone} onAddDate={addCompletedDate} />
            ))
          )}
          {hasMore && (
            <div className="flex justify-center">
              <button className="px-6 py-3 bg-indigo-600 rounded-lg" onClick={() => fetchList(false, { page: page + 1, append: true })} disabled={loading}>Load more</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
