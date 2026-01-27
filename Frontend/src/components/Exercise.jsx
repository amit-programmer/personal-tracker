import React, { useEffect, useState, useMemo } from "react";
import { getAuthToken } from "../middlewares/Auth";
import Nav from "./Nav";
import { Plus, Trash2, Edit2, Download, Calendar } from "lucide-react";

/**
 * Exercise.jsx
 * Modern dark-mode UI for exercises using Tailwind CSS.
 *
 * Usage: drop into your React app. Ensure Tailwind is configured with "class" darkMode
 * (so toggling document.documentElement.classList = 'dark' works).
 */

const API_BASE = "http://localhost:3000/api/other/exercises";

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt)) return "";
  return dt.toISOString().slice(0, 10);
}

function isoNowDate() {
  return new Date().toISOString().slice(0, 10);
}

function IconPlus() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5v14M5 12h14"
      />
    </svg>
  );
}
function IconDownload() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
      />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 4h7v7M21 3l-9 9-9 3 3-9 9-3z"
      />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 6h18M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"
      />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export default function ExercisePage() {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : true,
  );
  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState({
    start: new Date().toISOString().slice(0, 10), // today,
    end: getTomorrowDate(),
    type: "",
    done: "",
  });

  const [queryKey, setQueryKey] = useState(0); // bump to refetch

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null or exercise
  const [form, setForm] = useState({
    name: "",
    type: "other",
    intensity: "medium",
    done: false,
    date: isoNowDate(),
    notes: "",
  });

  // predefined options for type and intensity
  const TYPE_OPTIONS = [
    "cardio",
    "strength",
    "flexibility",
    "sports",
    "pushup",
    "pullup",
    "other",
  ];
  const INTENSITY_OPTIONS = ["low", "medium", "high"];

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (filter.start) params.append("start", filter.start);
        if (filter.end) params.append("end", filter.end);
        if (filter.type) params.append("type", filter.type);
        if (filter.done !== "") params.append("done", filter.done);
        const url = `${API_BASE}${params.toString() ? "?" + params.toString() : ""}`;
        const res = await authFetch(url);
        if (!res.ok) throw new Error("Failed to fetch exercises");
        const body = await res.json();
        // backend responds with { ok: true, data: [...] }
        const items = Array.isArray(body)
          ? body
          : Array.isArray(body && body.data)
            ? body.data
            : [];
        setExercises(items);
      } catch (e) {
        setError(e.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter, queryKey]);

  // helper that attaches auth header if token found
  async function authFetch(url, opts = {}) {
    const token = getAuthToken();
    const headers = { ...(opts.headers || {}) };
    if (token)
      headers.Authorization = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
    return fetch(url, { ...opts, headers });
  }

  function getTomorrowDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  function resetForm() {
    setForm({
      name: "",
      type: "other",
      intensity: "medium",
      done: false,
      date: isoNowDate(),
      notes: "",
    });
    setEditing(null);
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(ex) {
    setEditing(ex);
    setForm({
      name: ex.name || "",
      type: ex.type || "other",
      intensity: ex.intensity || "medium",
      done: !!ex.done,
      date: formatDate(ex.date) || isoNowDate(),
      notes: ex.notes || "",
    });
    setModalOpen(true);
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        // send the exact selected type (preserve sub-types like 'pushup')
        type: form.type || undefined,
        intensity: form.intensity || undefined,
        done: form.done,
        date: form.date || undefined,
        notes: form.notes || undefined,
      };
      const url = editing ? `${API_BASE}/${editing.id}` : API_BASE;
      const method = editing ? "PATCH" : "POST";
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Save failed");
      }
      setModalOpen(false);
      resetForm();
      setQueryKey((k) => k + 1);
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function destroy(id) {
    if (!confirm("Delete this exercise?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setQueryKey((k) => k + 1);
    } catch (e) {
      setError(e.message || "Delete error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleDone(ex) {
    // optimistic UI
    setExercises((prev) =>
      prev.map((p) => (p.id === ex.id ? { ...p, done: !p.done } : p)),
    );
    try {
      // backend expects PATCH on the toggle endpoint
      const res = await authFetch(`${API_BASE}/${ex.id}/toggle`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Toggle failed");
      // refresh to get canonical state
      setQueryKey((k) => k + 1);
    } catch (e) {
      setError(e.message || "Toggle error");
      setQueryKey((k) => k + 1);
    }
  }

  async function exportRange(download = false) {
    const params = new URLSearchParams();
    if (filter.start) params.append("start", filter.start);
    if (filter.end) params.append("end", filter.end);
    if (download) params.append("download", "1");
    const url = `${API_BASE}/export?${params.toString()}`;
    if (download) {
      // trigger browser download
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      try {
        const res = await authFetch(url);
        if (!res.ok) throw new Error("Export failed");
        const text = await res.text();
        // show export content in new window
        const w = window.open("", "_blank");
        w.document.write("<pre>" + escapeHtml(text) + "</pre>");
        w.document.title = "Exercises export";
      } catch (e) {
        setError(e.message || "Export failed");
      }
    }
  }

  function escapeHtml(s) {
    return String(s).replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );
  }

  const types = useMemo(() => {
    const set = new Set(exercises.map((e) => e.type).filter(Boolean));
    return Array.from(set);
  }, [exercises]);

    return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 exercise-root">
        <style>{`
                .exercise-root ::selection { background: #1213138a; color: #2ee0a8; }
                .exercise-root ::-moz-selection { background: #0f0f0f; color: #a82dd4; }
                /* subtle focused-selection shadow for modern look */
                .exercise-root ::selection { box-shadow: 0 0 0 3px rgba(14,165,255,0.12); }
            `}</style>
      <Nav />
      <div className="p-4 sm:p-6"> 
      <div className="max-w-6xl mx-auto mt-4">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Exercises
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track, edit and export your exercises.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* export button */}
            <div className="relative group inline-block">
              <button
                onClick={() => exportRange(true)}
                className="flex items-center gap-2
               px-3 py-2 text-sm rounded-md
               bg-indigo-600 hover:bg-indigo-500
               transition shadow-lg"
              >
                <IconDownload />
                Export
              </button>

              {/* Tooltip */}
              <span
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
               whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white
               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                Download export
              </span>
            </div>
            {/* new data create button */}
            <div className="relative group inline-block">
              <button
                onClick={openCreate}
                className="flex items-center gap-2
               px-3 py-2 rounded-md
               bg-green-500 hover:bg-green-400
               text-sm transition shadow-lg"
              >
                <IconPlus />
                New
              </button>

              {/* Tooltip */}
              <span
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
               whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white
               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                Create new item
              </span>
            </div>
          </div>
        </header>

        <section className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-6">
          <h2 className="text-sm font-medium mb-3">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="date"
              value={filter.start}
              onChange={(e) =>
                setFilter((f) => ({ ...f, start: e.target.value }))
              }
              className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700"
              placeholder="Start"
            />
            <input
              type="date"
              value={filter.end}
              onChange={(e) =>
                setFilter((f) => ({ ...f, end: e.target.value }))
              }
              className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700"
              placeholder="End"
            />
            <select
              value={filter.type}
              onChange={(e) =>
                setFilter((f) => ({ ...f, type: e.target.value }))
              }
              className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700"
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={filter.done}
              onChange={(e) =>
                setFilter((f) => ({ ...f, done: e.target.value }))
              }
              className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700"
            >
              <option value="">Any</option>
              <option value="true">Done</option>
              <option value="false">Not Done</option>
            </select>
          </div>
          <div className="mt-3 flex gap-2">

            {/* refresh button */}
            <div className="relative group inline-block">
  <button
    onClick={() => setQueryKey((k) => k + 1)}
    className="px-3 py-2 rounded
               bg-indigo-600 hover:bg-indigo-500
               text-sm transition shadow-lg"
  >
    Refresh
  </button>

  {/* Tooltip */}
  <span
    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
               whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white
               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
  >
    Refresh data
  </span>
</div>

           
           
          </div>
        </section>

        <main>
          <div className="space-y-3">
            {error && (
              <div className="p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {error}
              </div>
            )}
            {loading && (
              <div className="p-3 rounded bg-gray-100 dark:bg-gray-800 text-sm">
                Loading…
              </div>
            )}

            {exercises.length === 0 && !loading ? (
              <div className="p-6 rounded bg-white dark:bg-gray-800 text-center text-gray-500">
                No exercises found.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {exercises.map((ex) => (
                  <article
                    key={ex.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 pr-2">
                        <h3 className="text-lg font-semibold break-words">
                          {ex.name}
                          {ex.done && (
                            <span className="inline-flex items-center gap-1 text-green-400 text-sm bg-green-900/20 px-2 py-0.5 rounded ml-2">
                              <IconCheck /> Done
                            </span>
                          )}
                        </h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {ex.type ? (
                            <span className="capitalize">{ex.type}</span>
                          ) : (
                            <span className="italic">No type</span>
                          )}
                        </div>
                        <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                          {ex.notes || (
                            <span className="italic text-gray-400">
                              No notes
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 w-36 sm:w-44">
                        <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 capitalize text-right leading-tight">
                          {ex.intensity || ""}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(ex.date)}
                        </div>
                        <div className="flex gap-2 mt-2">
                            {/* done button  */}
                          <div className="relative group inline-block">
  <button
    onClick={() => toggleDone(ex)}
    className={`px-3 py-1.5 rounded-md text-sm font-medium
      transition-all duration-200 shadow-sm
      hover:shadow-md hover:-translate-y-0.5
      ${
        ex.done
          ? "bg-yellow-500 hover:bg-yellow-400 text-black"
          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
      }
    `}
  >
    {ex.done ? "Undo" : "Done"}
  </button>

  {/* Tooltip */}
  <span
    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
               whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white
               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
  >
    {ex.done ? "Mark as not done" : "Mark as done"}
  </span>
</div>


                          
                          {/* edit button */}
                                              <div className="relative group inline-block">
                                                <button
                                                  onClick={() => openEdit(ex)}
                                                  className="p-2 bg-gray-400 hover:bg-blue-600 rounded-lg transition shadow-lg"
                                                >
                                                  <Edit2 size={18} />
                                                </button>
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">Edit record</span>
                                              </div>
                        
                           {/* delete button */}
                                              <div className="relative group inline-block">
                                                <button
                                                 onClick={() => destroy(ex.id)}
                                                  className="p-2 bg-red-900 hover:bg-red-700 rounded-lg transition shadow-lg"
                                                >
                                                  <Trash2 size={18} />
                                                </button>
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">Delete record</span>
                                              </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur"
            onClick={() => {
              setModalOpen(false);
              resetForm();
            }}
          />
          <form
            onSubmit={submitForm}
            className="relative z-10 w-full max-w-full sm:max-w-2xl mx-4 sm:mx-0 bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editing ? "Edit Exercise" : "New Exercise"}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="text-sm px-3 py-1 rounded bg-gray-200 dark:bg-gray-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="text-sm px-3 py-1 rounded bg-indigo-600 text-white"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded bg-gray-100 dark:bg-gray-700"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Intensity</label>
                <select
                  value={form.intensity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, intensity: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded bg-gray-100 dark:bg-gray-700"
                >
                  {INTENSITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded bg-gray-100 dark:bg-gray-700"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded bg-gray-100 dark:bg-gray-700"
                  rows={4}
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.done}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, done: e.target.checked }))
                    }
                    className="rounded"
                  />
                  Mark done
                </label>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
    </div>
  );
}
