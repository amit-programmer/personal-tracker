import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Plus, Trash2, Edit2, Download, Calendar } from "lucide-react";

import Nav from "./Nav";

const API_BASE = "https://personal-tracker-x4kn.onrender.com/api/target";

const dark = {
  bg: "#0f1724",
  panel: "#0b1220",
  muted: "#9aa4b2",
  accent: "#7c5cff",
  danger: "#ff6b6b",
  success: "#32d583",
  card: "#0d1624",
  glass: "rgba(255,255,255,0.03)",
  radius: "12px",
  gap: "14px",
  padding: "14px",
  shadow: "0 6px 18px rgba(0,0,0,0.6)",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Segoe UI Mono', monospace",
};

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toISOString().slice(0, 10);
}

function formatDateDisplay(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yy = dt.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

export default function Target() {
  function getAuthToken() {
    if (typeof window === "undefined") return null;
    // check common cookie names
    const cookieMatch = document.cookie.match(
      new RegExp(
        "(?:^|; )" +
          "token".replace(/([.$?*|{}()\[\]\\/+^])/g, "\\$1") +
          "=([^;]*)",
      ),
    );
    if (cookieMatch) return decodeURIComponent(cookieMatch[1]);
    const sess =
      window.sessionStorage.getItem("token") ||
      window.sessionStorage.getItem("auth_token") ||
      window.sessionStorage.getItem("access_token");
    if (sess) return sess;
    const ls =
      window.localStorage.getItem("token") ||
      window.localStorage.getItem("auth_token") ||
      window.localStorage.getItem("access_token");
    return ls || null;
  }

  // Fetch helper with auth and abort support
  const abortRef = useRef(null);
  async function fetchWithAuth(url, opts = {}) {
    const token = getAuthToken();
    const headers = opts.headers ? { ...opts.headers } : {};
    if (token && !headers.Authorization)
      headers.Authorization = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
    // attach AbortController
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch (e) {}
    }
    const ctl = new AbortController();
    abortRef.current = ctl;
    const res = await fetch(url, {
      ...opts,
      headers,
      credentials: "include",
      signal: ctl.signal,
    });
    return res;
  }
  // simple in-memory cache for list results keyed by query string
  const listCacheRef = useRef(new Map());
  const inflightRef = useRef(new Map());
  const priorityColor = {
    low: "#60a5fa",
    medium: "#2db4ff",
    high: "#ff6b6b",
  };

  function getTomorrowDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  function priorityLabel(p) {
    if (!p) return "Medium";
    const s = String(p);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    start: new Date().toISOString().slice(0, 10), // today,
    end: getTomorrowDate(),
    userId: "",
  });
  const [modal, setModal] = useState({ open: false, mode: "view", data: null });
  const [form, setForm] = useState({
    title: "",
    description: "",
    targetDate: "",
    isAchieved: false,
    achievedAt: "",
    category: "other",
    priority: "medium",
  });

  // loadTargets defined below; effect moved to after its declaration to avoid TDZ

  const loadTargets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.start) params.set("start", filters.start);
      if (filters.end) params.set("end", filters.end);
      if (filters.userId) params.set("userId", filters.userId);
      const key = params.toString();

      // return cached result if present
      if (listCacheRef.current.has(key)) {
        setTargets(listCacheRef.current.get(key));
        setLoading(false);
        return;
      }

      // dedupe inflight requests
      if (inflightRef.current.has(key)) {
        const p = inflightRef.current.get(key);
        const data = await p;
        setTargets(data);
        setLoading(false);
        return;
      }

      const promise = (async () => {
        const res = await fetchWithAuth(`${API_BASE}${key ? "?" + key : ""}`);
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          console.error("loadTargets: fetch failed", res.status, txt);
          throw new Error("Failed to fetch targets");
        }
        const data = await res.json().catch(() => null);
        console.debug("loadTargets response:", data);
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.targets)) list = data.targets;
        else if (data && Array.isArray(data.rows)) list = data.rows;
        else if (data && Array.isArray(data.items)) list = data.items;
        else if (data && Array.isArray(data.result)) list = data.result;
        else list = [];
        listCacheRef.current.set(key, list);
        return list;
      })();

      inflightRef.current.set(key, promise);
      const result = await promise;
      inflightRef.current.delete(key);
      setTargets(result);
    } catch (e) {
      if (e.name === "AbortError") {
        console.debug("loadTargets aborted");
      } else {
        console.error(e);
        alert("Failed to load targets");
      }
    } finally {
      setLoading(false);
    }
  }, [filters.start, filters.end, filters.userId]);

  // call loadTargets after it's defined
  useEffect(() => {
    loadTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTargets]);

  async function loadSingle(id) {
    try {
      const res = await fetchWithAuth(`${API_BASE}/${id}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("loadSingle: fetch failed", res.status, txt);
        return null;
      }
      const data = await res.json().catch(() => null);
      if (!data) return null;
      // Accept different shapes from backend
      if (Array.isArray(data)) return data[0] || null;
      if (data.data)
        return (
          data.data && (Array.isArray(data.data) ? data.data[0] : data.data)
        );
      if (data.target) return data.target;
      return data;
    } catch (e) {
      console.error(e);
      alert("Failed to fetch target");
    }
  }

  function openCreate() {
    setForm({
      title: "",
      description: "",
      targetDate: formatDate(new Date()),
      isAchieved: false,
      achievedAt: "",
      category: "other",
      priority: "medium",
    });
    setModal({ open: true, mode: "create", data: null });
  }

  async function openEdit(id) {
    const data = await loadSingle(id);
    if (!data) return;
    setForm({
      title: data.title || "",
      description: data.description || "",
      targetDate: formatDate(data.targetDate) || "",
      isAchieved: !!data.isAchieved,
      achievedAt: data.achievedAt ? formatDate(data.achievedAt) : "",
      category: data.category || "other",
      priority: data.priority || "medium",
    });
    setModal({ open: true, mode: "edit", data: data });
  }

  async function openView(id) {
    const data = await loadSingle(id);
    if (!data) return;
    setModal({ open: true, mode: "view", data });
  }

  async function submitCreate(e) {
    e && e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        targetDate: form.targetDate,
        isAchieved: form.isAchieved,
        achievedAt: form.achievedAt || undefined,
        category: form.category,
        priority: form.priority || "medium",
      };
      const res = await fetchWithAuth(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Create failed");
      setModal({ open: false, mode: "view", data: null });
      // invalidate cache and reload
      try {
        listCacheRef.current.clear();
      } catch (e) {}
      await loadTargets();
    } catch (err) {
      console.error(err);
      alert("Failed to create target");
    }
  }

  async function submitEdit(e) {
    e && e.preventDefault();
    try {
      const id =
        modal.data && modal.data._id
          ? modal.data._id
          : modal.data && modal.data.id;
      if (!id) return alert("No id");
      const payload = {
        title: form.title,
        description: form.description,
        targetDate: form.targetDate,
        isAchieved: form.isAchieved,
        achievedAt: form.achievedAt || undefined,
        category: form.category,
        priority: form.priority || "medium",
      };
      const res = await fetchWithAuth(`${API_BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      setModal({ open: false, mode: "view", data: null });
      // invalidate cache and reload
      try {
        listCacheRef.current.clear();
      } catch (e) {}
      await loadTargets();
    } catch (err) {
      console.error(err);
      alert("Failed to update target");
    }
  }

  

  async function doMark(id) {
    try {
      // legacy endpoint: PATCH /:id/achieve (no body)
      const res = await fetchWithAuth(`${API_BASE}/${id}/achieve`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Mark failed");
      try {
        listCacheRef.current.clear();
      } catch (e) {}
      await loadTargets();
    } catch (err) {
      console.error(err);
      alert("Failed to mark achieved");
    }
  }

  

  async function doExport(download = false) {
    try {
      const params = new URLSearchParams();
      if (filters.start) params.set("start", filters.start);
      if (filters.end) params.set("end", filters.end);
      if (filters.userId) params.set("userId", filters.userId);
      if (download) params.set("download", "1");
      const url = `${API_BASE}/export?${params.toString()}`;
      if (download) {
        const res = await fetchWithAuth(url);
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `targets_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
        return;
      }
      const res = await fetchWithAuth(url);
      const data = await res.json();
      console.log("Export preview:", data);
      alert("Exported to console (preview). Use download=true to get a TXT.");
    } catch (e) {
      console.error(e);
      alert("Export failed");
    }
  }

  // Tailwind-based classes will be used instead of inline styles.

  // split targets into achieved / pending (memoized)
  const achievedTargets = useMemo(
    () => targets.filter((t) => !!t.isAchieved),
    [targets],
  );
  const pendingTargets = useMemo(
    () => targets.filter((t) => !t.isAchieved),
    [targets],
  );

  // optimistic toggle achieved
  const toggleAchieved = useCallback(
    async (id, value) => {
      // optimistic update
      setTargets((prev) =>
        prev.map((t) => (t._id === id || t.id === id ? { ...t, isAchieved: !!value } : t)),
      );
      try {
        const payload = {
          isAchieved: !!value,
          achievedAt: value ? formatDate(new Date()) : undefined,
        };
        let res = await fetchWithAuth(`${API_BASE}/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          res = await fetchWithAuth(`${API_BASE}/${id}/achieve`, {
            method: "PATCH",
          });
        }
        if (!res.ok) throw new Error("Toggle failed");
        // invalidate cache and refresh list (will use cache/dedupe)
        try {
          listCacheRef.current.clear();
        } catch (e) {}
        await loadTargets();
      } catch (err) {
        console.error(err);
        alert("Failed to update achieved state");
        // revert optimistic
        try {
          listCacheRef.current.clear();
        } catch (e) {}
        await loadTargets();
      }
    },
    [loadTargets],
  );

  const doDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this target?")) return;
      // optimistic remove
      const before = targets;
      setTargets((prev) => prev.filter((t) => !(t._id === id || t.id === id)));
      try {
        const res = await fetchWithAuth(`${API_BASE}/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Delete failed");
        // invalidate cache and refresh
        try {
          listCacheRef.current.clear();
        } catch (e) {}
        await loadTargets();
      } catch (err) {
        console.error(err);
        alert("Failed to delete");
        // revert
        setTargets(before);
      }
    },
    [loadTargets, targets],
  );

  return (
    <div className="target-root min-h-screen  bg-gradient-to-b from-[#0b1020] to-[#211032] text-white font-sans">
      <style>{`
                .target-root ::selection { background: #1213138a; color: #2ee0a8; }
                .target-root ::-moz-selection { background: #0f0f0f; color: #a82dd4; }
                /* subtle focused-selection shadow for modern look */
                .target-root ::selection { box-shadow: 0 0 0 3px rgba(14,165,255,0.12); }
            `}</style>
      <Nav />
      <div className="p-9">
        <div className="mb-4">
          <div className="flex gap-3 items-center">
            <div className="flex gap-2 items-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <rect
                  x="2"
                  y="3"
                  width="20"
                  height="18"
                  rx="3"
                  stroke={dark.accent}
                  strokeWidth="1.5"
                />
                <path
                  d="M8 7v6"
                  stroke={dark.accent}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M12 5v8"
                  stroke={dark.accent}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M16 9v4"
                  stroke={dark.accent}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <div>
                <div className="text-lg font-extrabold">Target Dashboard</div>
                <div className="text-[#9aa4b2] text-sm">Manage your goals</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 items-center mt-4 flex-wrap">
            <input
              className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] px-3 py-2 rounded-xl text-[rgba(255,255,255,0.9)] min-w-[220px]"
              type="date"
              value={filters.start}
              onChange={(e) =>
                setFilters((s) => ({ ...s, start: e.target.value }))
              }
              title="start"
            />
            <input
              className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] px-3 py-2 rounded-xl text-[rgba(255,255,255,0.9)] min-w-[220px]"
              type="date"
              value={filters.end}
              onChange={(e) =>
                setFilters((s) => ({ ...s, end: e.target.value }))
              }
              title="end"
            />

            {/* filter button */}
            <div className="relative group inline-block">
              <button
                onClick={loadTargets}
                disabled={loading}
                className={`
      bg-[#7c5cff] text-white px-3 py-2 rounded-lg
      cursor-pointer font-semibold
      transition-all duration-200
      shadow-lg
      ${
        loading
          ? "opacity-60 cursor-not-allowed"
          : "hover:bg-[#8b6cff] hover:-translate-y-0.5 hover:shadow-[#7c5cff]/50"
      }
    `}
              >
                {loading ? "Loading..." : "Filter"}
              </button>

              {/* Tooltip */}
              {!loading && (
                <span
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                 whitespace-nowrap rounded-md bg-black
                 px-3 py-1 text-xs text-white
                 opacity-0 group-hover:opacity-100
                 transition-opacity duration-200"
                >
                  Apply filters
                </span>
              )}
            </div>

            {/* export button  */}
            <div className="relative group inline-block">
              <button
                onClick={() => doExport(true)}
                className="bg-[#0ea5a4] hover:bg-[#14b8b7]
               text-white px-3 py-2 rounded-lg
               cursor-pointer font-semibold
               transition-all duration-200
               shadow-lg hover:shadow-[#0ea5a4]/50
               hover:-translate-y-0.5"
              >
                Export
              </button>

              {/* Tooltip */}
              <span
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
               whitespace-nowrap rounded-md bg-black
               px-3 py-1 text-xs text-white
               opacity-0 group-hover:opacity-100
               transition-opacity duration-200"
              >
                Export data
              </span>
            </div>
            {/* new button  */}
            <div className="relative group inline-block">
              <button
                onClick={openCreate}
                className="bg-[#7c5cff] hover:bg-[#8b6cff]
               text-white px-3 py-2 rounded-lg
               cursor-pointer font-semibold
               transition-all duration-200
               shadow-lg hover:shadow-[#7c5cff]/50
               hover:-translate-y-0.5"
              >
                + New
              </button>

              {/* Tooltip */}
              <span
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
               whitespace-nowrap rounded-md bg-black
               px-3 py-1 text-xs text-white
               opacity-0 group-hover:opacity-100
               transition-opacity duration-200"
              >
                Create new item
              </span>
            </div>
          </div>
        </div>

        <div className="mb-3 text-[#9aa4b2]">
          <span className="mr-4">Achieved: {achievedTargets.length}</span>
          <span>Pending: {pendingTargets.length}</span>
        </div>

        {/* Achieved section */}
        <div className="mb-4">
          <div className="text-sm text-[#9aa4b2] mb-2">Achieved</div>
          <div className="flex flex-col gap-3">
            {achievedTargets.length === 0 && (
              <div className="text-[#9aa4b2]">No achieved targets yet.</div>
            )}
            {achievedTargets.map((t) => {
              const id = t._id || t.id;
              const due = t.targetDate ? new Date(t.targetDate) : null;
              return (
                <div
                  key={id}
                  className="bg-[rgba(255,255,255,0.02)] p-5 rounded-lg shadow-lg border border-[rgba(255,255,255,0.04)] mb-3 flex flex-wrap gap-3 items-center justify-between"
                >
                  <div className="flex-1 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!t.isAchieved}
                      onChange={(e) => toggleAchieved(id, e.target.checked)}
                      className="mt-1 w-4 h-4"
                      title="Toggle achieved"
                    />
                    <div>
                      <div className="text-lg font-extrabold">{t.title}</div>
                      <div className="text-[#9aa4b2] mt-2 italic">
                        {t.description || "No description"}
                      </div>
                      <div className="mt-3 text-[#9aa4b2] flex gap-3 items-center">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M7 10h5v5"
                            stroke="#9aa4b2"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="text-sm">
                          {formatDateDisplay(t.targetDate)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[160px] flex items-center justify-end flex-col gap-3">
                    <div className="text-right mr-2">
                      <div
                        style={{
                          fontSize: 34,
                          fontWeight: 800,
                          color: priorityColor[t.priority] || "#9aa4b2",
                          textTransform: "capitalize",
                        }}
                      >
                        {priorityLabel(t.priority)}
                      </div>
                    </div>
                    <div className="flex flex-row gap-2">
                      {/* edit button */}
                      <div className="relative group inline-block">
                        <button
                          onClick={() => openEdit(id)}
                          className="p-2 bg-gray-400 hover:bg-blue-600 rounded-lg transition shadow-lg"
                        >
                          <Edit2 size={18} />
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Edit record
                        </span>
                      </div>
                      {/* delete button */}
                      <div className="relative group inline-block">
                        <button
                          onClick={() => doDelete(id)}
                          className="p-2 bg-red-900 hover:bg-red-700 rounded-lg transition shadow-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Delete record
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending section */}
        <div>
          <div className="text-sm text-[#9aa4b2] mb-2">Pending</div>
          <div className="flex flex-col gap-3">
            {pendingTargets.length === 0 && (
              <div className="text-[#9aa4b2]">No pending targets.</div>
            )}
            {pendingTargets.map((t) => {
              const id = t._id || t.id;
              const due = t.targetDate ? new Date(t.targetDate) : null;
              return (
                <div
                  key={id}
                  className="bg-[rgba(255,255,255,0.02)] p-5 rounded-lg shadow-lg border border-[rgba(255,255,255,0.04)] mb-3 flex flex-wrap gap-3 items-center justify-between"
                >
                  <div className="flex-1 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!t.isAchieved}
                      onChange={(e) => toggleAchieved(id, e.target.checked)}
                      className="mt-1 w-4 h-4"
                      title="Toggle achieved"
                    />
                    <div>
                      <div className="text-lg font-extrabold">{t.title}</div>
                      <div className="text-[#9aa4b2] mt-2 italic">
                        {t.description || "No description"}
                      </div>
                      <div className="mt-3 text-[#9aa4b2] flex gap-3 items-center">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M7 10h5v5"
                            stroke="#9aa4b2"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="text-sm">
                          {formatDateDisplay(t.targetDate)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-[160px] flex items-center justify-end flex-col gap-3">
                    <div className="text-right mr-2">
                      <div
                        style={{
                          fontSize: 34,
                          fontWeight: 800,
                          color: priorityColor[t.priority] || "#9aa4b2",
                          textTransform: "capitalize",
                        }}
                      >
                        {priorityLabel(t.priority)}
                      </div>
                    </div>
                    <div className="flex flex-row gap-2">
                      <div className="relative group inline-block">
                        <button
                          onClick={() => openEdit(id)}
                          className="p-2 bg-gray-400 hover:bg-blue-600 rounded-lg transition shadow-lg"
                        >
                          <Edit2 size={18} />
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Edit record
                        </span>
                      </div>

                      <div className="relative group inline-block">
                        <button
                          onClick={() => doDelete(id)}
                          className="p-2 bg-red-900 hover:bg-red-700 rounded-lg transition shadow-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Delete record
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {modal.open && (
          <div
            className="fixed inset-0 bg-[rgba(2,6,23,0.6)] flex items-center justify-center z-50"
            onMouseDown={() =>
              setModal({ open: false, mode: "view", data: null })
            }
          >
            <div
              className="bg-[#0b1220] rounded-lg p-5 w-[720px] max-w-[96%] shadow-lg border border-[rgba(255,255,255,0.03)]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {modal.mode === "view" && modal.data && (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-extrabold">
                        {modal.data.title}
                      </div>
                      <div className="text-[#9aa4b2]">
                        {modal.data.category || "General"} ·{" "}
                        {formatDate(modal.data.targetDate)}
                      </div>
                    </div>
                    <div>
                      {modal.data.isAchieved ? (
                        <span className="px-3 py-1 rounded-full bg-[#32d583] text-white font-semibold">
                          Achieved{" "}
                          {modal.data.achievedAt
                            ? formatDate(modal.data.achievedAt)
                            : ""}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-[rgba(255,255,255,0.03)] text-white font-semibold">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 text-[#9aa4b2]">
                    {modal.data.description || "No description"}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      className="bg-[#7c5cff] text-white px-3 py-2 rounded-lg font-semibold"
                      onClick={() => openEdit(modal.data._id || modal.data.id)}
                    >
                      Edit
                    </button>
                    {!modal.data.isAchieved && (
                      <button
                        className="bg-[#32d583] text-white px-3 py-2 rounded-lg font-semibold"
                        onClick={() => {
                          doMark(modal.data._id || modal.data.id);
                          setModal({ open: false });
                        }}
                      >
                        Mark Achieved
                      </button>
                    )}
                    <button
                      className="bg-[#ff6b6b] text-white px-3 py-2 rounded-lg font-semibold"
                      onClick={() => {
                        doDelete(modal.data._id || modal.data.id);
                        setModal({ open: false });
                      }}
                    >
                      Delete
                    </button>
                    <button
                      className="bg-[#111827] text-white px-3 py-2 rounded-lg font-semibold"
                      onClick={() => setModal({ open: false })}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}

              {(modal.mode === "create" || modal.mode === "edit") && (
                <form
                  onSubmit={modal.mode === "create" ? submitCreate : submitEdit}
                >
                  <div className="flex flex-wrap gap-3">
                    <input
                      required
                      placeholder="Title"
                      className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] px-3 py-2 rounded-xl text-[rgba(255,255,255,0.9)] flex-1 min-w-[160px]"
                      value={form.title}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, title: e.target.value }))
                      }
                    />
                    <input
                      required
                      type="date"
                      className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] px-3 py-2 rounded-xl text-[rgba(255,255,255,0.9)] w-[140px] min-w-[120px]"
                      value={form.targetDate}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, targetDate: e.target.value }))
                      }
                    />
                  </div>

                  <textarea
                    placeholder="Description"
                    className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] px-3 py-2 rounded-xl text-[rgba(255,255,255,0.9)] w-full min-h-[100px] mt-3 resize-vertical"
                    value={form.description}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, description: e.target.value }))
                    }
                  />

                  <div className="flex gap-3 mt-3 items-center flex-wrap">
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, category: e.target.value }))
                      }
                      className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] px-3 py-2 rounded-xl text-[rgba(255,255,255,0.9)]"
                    >
                      <option value="work">work</option>
                      <option value="health">health</option>
                      <option value="personal">personal</option>
                      <option value="finance">finance</option>
                      <option value="learning">learning</option>
                      <option value="other">other</option>
                    </select>

                    <select
                      value={form.priority}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, priority: e.target.value }))
                      }
                      className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] px-3 py-2 rounded-xl text-[rgba(255,255,255,0.9)] w-[140px]"
                    >
                      <option value="low">low</option>
                      <option value="medium">medium</option>
                      <option value="high">high</option>
                    </select>
                    <label className="flex items-center gap-2 text-[#9aa4b2]">
                      <input
                        type="checkbox"
                        checked={form.isAchieved}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            isAchieved: e.target.checked,
                          }))
                        }
                      />
                      <span>Achieved</span>
                    </label>
                    {form.isAchieved && (
                      <input
                        type="date"
                        className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] px-3 py-2 rounded-xl text-[rgba(255,255,255,0.9)]"
                        value={form.achievedAt}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, achievedAt: e.target.value }))
                        }
                      />
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="submit"
                      className="bg-[#7c5cff] text-white px-3 py-2 rounded-lg font-semibold"
                    >
                      {modal.mode === "create" ? "Create" : "Save"}
                    </button>
                    <button
                      type="button"
                      className="bg-[#111827] text-white px-3 py-2 rounded-lg font-semibold"
                      onClick={() => setModal({ open: false })}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
