import React, { useEffect, useState } from "react";
import axios from "axios";
import { attachAuthToAxios } from "../middlewares/Auth";
import Nav from "./Nav";

/**
 * Finance.jsx
 * TailwindCSS dark UI Finance Tracker page.
 * Place in: src/components/Finance.jsx
 */

const API_BASE = "https://personal-tracker-x4kn.onrender.comapi/finance";

// axios client used for all finance API calls; auth header attached by helper
const apiClient = axios.create({ baseURL: API_BASE });
attachAuthToAxios(apiClient);

function formatCurrency(v, cur = "INR") {
    if (v == null) return "-";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: cur }).format(v);
}

// Modern Calendar Picker Component
function ModernCalendar({ selectedDate, onDateSelect, onClose }) {
    const [viewMode, setViewMode] = useState("day"); // day, month, year
    const [currentDate, setCurrentDate] = useState(new Date(selectedDate || new Date()));
    const [selectedDay, setSelectedDay] = useState(selectedDate ? new Date(selectedDate).getDate() : null);

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handleDaySelect = (day) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const formatted = newDate.toISOString().split('T')[0];
        onDateSelect(formatted);
        onClose();
    };

    const handleMonthSelect = (month) => {
        setCurrentDate(new Date(currentDate.getFullYear(), month, 1));
        setViewMode("day");
    };

    const handleYearSelect = (year) => {
        setCurrentDate(new Date(year, currentDate.getMonth(), 1));
        setViewMode("month");
    };

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
        days.push(i);
    }

    const years = Array.from({ length: 12 }, (_, i) => currentDate.getFullYear() - 6 + i);

    return (
        <div className="relative z-9999 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl p-5 border border-cyan-500/20 backdrop-blur-xl min-w-80">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => {
                        if (viewMode === "day") setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
                        else if (viewMode === "month") setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
                        else setCurrentDate(new Date(currentDate.getFullYear() - 12, currentDate.getMonth(), 1));
                    }}
                    className="w-8 h-8 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
                >
                    ▲
                </button>
                <button onClick={() => viewMode === "day" ? setViewMode("month") : setViewMode("year")} className="text-cyan-300 font-semibold hover:text-cyan-200 transition-colors">
                    {viewMode === "day" && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                    {viewMode === "month" && `${currentDate.getFullYear()}`}
                    {viewMode === "year" && `${years[0]} - ${years[11]}`}
                </button>
                <button
                    onClick={() => {
                        if (viewMode === "day") setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
                        else if (viewMode === "month") setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
                        else setCurrentDate(new Date(currentDate.getFullYear() + 12, currentDate.getMonth(), 1));
                    }}
                    className="w-8 h-8 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 rounded-lg transition-colors"
                >
                    ▼
                </button>
            </div>

            {/* Day View */}
            {viewMode === "day" && (
                <>
                    <div className="grid grid-cols-7 gap-1 mb-3">
                        {dayNames.map(day => (
                            <div key={day} className="text-center text-xs text-cyan-300/70 font-semibold py-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => (
                            <button
                                key={idx}
                                disabled={!day}
                                onClick={() => day && handleDaySelect(day)}
                                className={`
                                    aspect-square rounded-lg text-sm font-medium transition-all duration-200
                                    ${!day ? 'bg-transparent' : 
                                    day === selectedDay && new Date(currentDate).getMonth() === new Date(selectedDate).getMonth()
                                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                                        : 'bg-slate-700/40 text-gray-300 hover:bg-cyan-500/30 hover:text-cyan-200'
                                    }
                                `}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 flex gap-2 text-xs">
                        <button onClick={() => handleDaySelect(new Date().getDate())} className="flex-1 py-2 bg-slate-700/40 hover:bg-slate-600/60 text-cyan-300 rounded-lg transition-colors">
                            Today
                        </button>
                        <button onClick={onClose} className="flex-1 py-2 bg-slate-700/40 hover:bg-slate-600/60 text-cyan-300 rounded-lg transition-colors">
                            Close
                        </button>
                    </div>
                </>
            )}

            {/* Month View */}
            {viewMode === "month" && (
                <div className="grid grid-cols-3 gap-2">
                    {monthNames.map((month, idx) => (
                        <button
                            key={month}
                            onClick={() => handleMonthSelect(idx)}
                            className={`
                                py-3 rounded-lg font-medium transition-all duration-200
                                ${idx === currentDate.getMonth()
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                                    : 'bg-slate-700/40 text-gray-300 hover:bg-cyan-500/30 hover:text-cyan-200'
                                }
                            `}
                        >
                            {month}
                        </button>
                    ))}
                </div>
            )}

            {/* Year View */}
            {viewMode === "year" && (
                <div className="grid grid-cols-3 gap-2">
                    {years.map((year) => (
                        <button
                            key={year}
                            onClick={() => handleYearSelect(year)}
                            className={`
                                py-3 rounded-lg font-medium transition-all duration-200
                                ${year === currentDate.getFullYear()
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                                    : 'bg-slate-700/40 text-gray-300 hover:bg-cyan-500/30 hover:text-cyan-200'
                                }
                            `}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Finance() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);
    const [month, setMonth] = useState(() => {
        // default to current month in YYYY-MM format
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [totals, setTotals] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        name: "",
        type: "expense",
        rupees: "",
        currency: "INR",
        description: "",
    });
    const [error, setError] = useState("");

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line
    }, [start, end]);

    async function fetchAll() {
        setLoading(true);
        setError("");
        try {
            const params = {};
            if (start) params.start = start;
            if (end) params.end = end;
            const res = await apiClient.get("/", { params });
            const payload = res.data;
            const list = Array.isArray(payload) ? payload : payload.records || payload.data || payload;
            setRecords(Array.isArray(list) ? list : []);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Error";
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setLoading(false);
        }
        fetchTotals();
    }

    async function fetchTotals() {
        try {
            const params = {};
            if (start) params.start = start;
            if (end) params.end = end;
            const res = await apiClient.get("/totals", { params });
            const payload = res.data;
            setTotals(payload && (payload.data || payload) ? (payload.data || payload) : {});
        } catch {
            setTotals({});
        }
    }

    // when month changes, set start/end to month bounds (YYYY-MM-DD)
    useEffect(() => {
        if (!month) return;
        const [y, m] = month.split('-').map(Number);
        if (!y || !m) return;
        const first = new Date(y, m - 1, 1);
        const last = new Date(y, m, 0); // last day of month
        const s = first.toISOString().split('T')[0];
        const e = last.toISOString().split('T')[0];
        setStart(s);
        setEnd(e);
        // fetchAll will run because start/end are dependencies
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month]);

    // Circular progress component (expense ratio) with vibrant cyan-blue gradient
    function CircularProgress({ percent = 0, size = 92 }) {
        const stroke = 8;
        const radius = (size - stroke) / 2;
        const circumference = 2 * Math.PI * radius;
        const dash = Math.max(0, Math.min(100, percent)) / 100 * circumference;
        return (
            <div className="w-full flex items-center justify-center">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <defs>
                        <linearGradient id="gradStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" />
                            <stop offset="50%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                    </defs>
                    <g transform={`translate(${size / 2}, ${size / 2})`}>
                        <circle r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
                        <circle
                            r={radius}
                            fill="none"
                            stroke="url(#gradStroke)"
                            strokeWidth={stroke}
                            strokeLinecap="round"
                            strokeDasharray={`${dash} ${circumference - dash}`}
                            strokeDashoffset={-circumference * 0.25}
                            transform={`rotate(-90)`}
                        />
                    </g>
                </svg>
            </div>
        );
    }

    function openNew() {
        setEditing(null);
        setForm({
            name: "",
            type: "expense",
            rupees: "",
            currency: "INR",
            description: "",
        });
        setShowForm(true);
    }

    function openEdit(rec) {
        setEditing(rec);
        setForm({
            name: rec.name || "",
            type: rec.type || "expense",
            rupees: rec.rupees ?? "",
            currency: rec.currency || "INR",
            description: rec.description || "",
        });
        setShowForm(true);
    }

    async function submitForm(e) {
        e.preventDefault();
        setError("");
        const payload = {
            name: form.name,
            type: form.type,
            rupees: Number(form.rupees),
            currency: form.currency,
            description: form.description,
        };
        try {
            const recordId = editing?.id ?? editing?._id;
            if (editing && recordId) {
                // Update existing record using PATCH API
                await apiClient.patch(`/${recordId}`, payload);
            } else {
                // Create new record using POST API
                await apiClient.post("/", payload);
            }
            setShowForm(false);
            await fetchAll();
            await fetchTotals();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data || err.message || "Save error";
            setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    }

    async function remove(id) {
        if (!confirm("Delete this record?")) return;
        try {
            await apiClient.delete(`/${id}`);
            setRecords((s) => s.filter((r) => r.id !== id && r._id !== id));
            await fetchTotals();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || "Delete error";
            alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    }

    async function exportRange(download = true) {
        try {
            let q = "";
            if (start) q += `start=${encodeURIComponent(start)}`;
            if (end) q += `${q ? "&" : ""}end=${encodeURIComponent(end)}`;
            if (download) q += `${q ? "&" : ""}download=1`;
            const params = {};
            if (start) params.start = start;
            if (end) params.end = end;
            if (download) params.download = 1;
            if (download) {
                const res = await apiClient.get('/export', { params, responseType: 'blob' });
                const blob = res.data;
                const contentDisp = res.headers['content-disposition'];
                const filename = contentDisp?.split('filename=')?.[1] || 'export.txt';
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = filename.replace(/['"]/g, '');
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                const query = new URLSearchParams(params).toString();
                window.open(`${API_BASE}/export${query ? '?' + query : ''}`, '_blank');
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Export error';
            alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    }

    return (
        <div className="relative z-0 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100">
            <Nav />
            <div className="p-6">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">Finance Tracker</h1>
                            <p className="text-sm text-cyan-300/70 mt-1">Smart money management at your fingertips</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 justify-start md:gap-3 md:justify-center">
                            <label className="text-sm text-cyan-300 font-medium">Month</label>
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="bg-slate-800/50 text-gray-100 p-2 md:p-3 rounded-lg border border-cyan-500/30 hover:border-cyan-400/70 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 cursor-pointer backdrop-blur-sm text-sm md:text-base"
                            />
                            <button
                                onClick={openNew}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-emerald-500/40 text-white whitespace-nowrap"
                            >
                                + New
                            </button>
                            <button
                                onClick={() => exportRange(true)}
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-indigo-500/40 text-white whitespace-nowrap"
                            >
                                ⬇ Export
                            </button>
                        </div>

                        <div className="flex items-center gap-4 justify-end">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm text-cyan-300/70">Totals (selected month)</div>
                                <div className="text-lg font-medium space-y-1">
                                    <div><span className="text-emerald-400">Income: {formatCurrency(totals?.income ?? 0)}</span></div>
                                    <div><span className="text-rose-400">Expense: {formatCurrency(totals?.expense ?? 0)}</span></div>
                                </div>
                            </div>
                            <div className="w-24 h-24">
                                {(() => {
                                    const income = totals?.income ?? 0;
                                    const expense = totals?.expense ?? 0;
                                    const percent = income > 0 ? Math.round((expense / income) * 100) : (expense > 0 ? 100 : 0);
                                    return (
                                        <div className="flex flex-col items-center">
                                            <CircularProgress percent={percent} size={92} />
                                            <div className="text-xs text-center mt-1">Spent {percent}%</div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </header>

                <section className="bg-gradient-to-r from-slate-800/40 to-slate-800/20 p-5 rounded-xl mb-6 shadow-lg border border-cyan-500/10 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row md:items-end md:gap-4">

                        {/* start */}
                        <div className="flex gap-2 items-center">
                            <label className="text-sm text-cyan-300 font-medium">Start</label>
                            <input
                                type="text"
                                placeholder="YYYY-MM-DD"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                className="bg-transparent  text-gray-100 px-3 py-2
                                w-32 text-center rounded-lg border border-cyan-500/30 hover:border-cyan-400/70 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 backdrop-blur-sm"
                            />
                        </div>

                        {/* end */}
                        <div className="flex gap-2 items-center mt-4 md:mt-0">
                            <label className="text-sm text-cyan-300 font-medium">End</label>
                            <input
                                type="text"
                                 placeholder="YYYY-MM-DD"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                className="bg-transparent  text-gray-100 px-3 py-2
                                w-32 text-center rounded-lg border border-cyan-500/30 hover:border-cyan-400/70 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 backdrop-blur-sm"
                            />
                        </div>

                        <div className="mt-4 md:mt-0">
                            <button
                                onClick={fetchAll}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/40 w-full md:w-auto"
                            >
                                Refresh
                            </button>
                        </div>

{/* total period */}
                        <div className="ml-auto text-right mt-4 md:mt-0">
                            <div className="text-sm text-cyan-300/70 font-medium">Period Totals</div>
                            <div className="text-lg font-semibold space-y-1">
                                <div><span className="text-emerald-400">Income: {formatCurrency(totals?.income ?? 0)}</span></div>
                                <div><span className="text-rose-400">Expense: {formatCurrency(totals?.expense ?? 0)}</span></div>
                                <div><span className="text-blue-400">Net: {formatCurrency((totals?.income ?? 0) - (totals?.expense ?? 0))}</span></div>
                            </div>
                        </div>
                    </div>
                </section>

{/*  data showing table */}
                <section>
                    <div className="z-99 bg-slate-800/30 rounded-xl shadow-xl overflow-auto border border-cyan-500/10 backdrop-blur-sm">
                        <table className="min-w-full table-auto divide-y divide-slate-700/50">
                            <thead className="bg-gradient-to-r from-slate-900/80 to-slate-800/80">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm text-cyan-300 font-semibold">Date</th>
                                    <th className="px-4 py-3 text-left text-sm text-cyan-300 font-semibold">Name</th>
                                    <th className="px-4 py-3 text-left text-sm text-cyan-300 font-semibold">Type</th>
                                    <th className="px-4 py-3 text-right text-sm text-cyan-300 font-semibold">Amount</th>
                                    <th className="px-4 py-3 text-left text-sm text-cyan-300 font-semibold">Currency</th>
                                    <th className="px-4 py-3 text-left text-sm text-cyan-300 font-semibold">Description</th>
                                    <th className="px-4 py-3 text-right text-sm text-cyan-300 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="p-6 text-center text-gray-400">Loading...</td>
                                    </tr>
                                ) : records.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-6 text-center text-gray-500">No records</td>
                                    </tr>
                                ) : (
                                    records.map((r) => (
                                        <tr key={r.id ?? r._id} className="hover:bg-cyan-500/5 transition-colors duration-150">
                                            <td className="px-4 py-3 text-sm text-gray-200">{(r.day || "").slice(0, 10)}</td>
                                            <td className="px-4 py-3 text-sm text-gray-100 font-medium">{r.name}</td>
                                            <td className="px-4 py-3 text-sm capitalize">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                  r.type === 'expense' ? 'bg-rose-500/20 text-rose-300' :
                                                  r.type === 'income' ? 'bg-emerald-500/20 text-emerald-300' :
                                                  'bg-purple-500/20 text-purple-300'
                                                }`}>{r.type}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-blue-300">
                                                {formatCurrency(r.rupees, r.currency || "INR")}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-300">{r.currency}</td>
                                            <td className="px-4 py-3 text-sm text-gray-400">{r.description}</td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <div className="inline-flex gap-2">
                                                    <button
                                                        onClick={() => openEdit(r)}
                                                        className="px-3 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg text-xs font-medium transition-all duration-200 shadow-md hover:shadow-amber-500/30"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => remove(r.id ?? r._id)}
                                                        className="px-3 py-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-lg text-xs font-medium transition-all duration-200 shadow-md hover:shadow-rose-500/30"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {error && <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm">{error}</div>}
                </section>

                {showForm && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <form
                            onSubmit={submitForm}
                            className="w-full max-w-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-2xl ring-1 ring-cyan-500/30 backdrop-blur-xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{editing ? "Edit Record" : "New Record"}</h2>
                                <button type="button" onClick={() => setShowForm(false)} className="text-cyan-400/70 hover:text-cyan-300 transition-colors">✕</button>
                            </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="text-sm text-cyan-300 font-semibold">Name</label>
                                            <input
                                                required
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                className="w-full mt-2 p-3 bg-slate-800/50 text-gray-100 rounded-lg border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 placeholder:text-slate-500 transition-all duration-200 backdrop-blur-sm"
                                                placeholder="Salary, Grocery, Stocks..."
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm text-cyan-300 font-semibold">Type</label>
                                            <select
                                                value={form.type}
                                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                                className="w-full mt-2 p-3 bg-slate-800/50 text-gray-100 rounded-lg border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 backdrop-blur-sm cursor-pointer"
                                            >
                                                <option value="expense">Expense</option>
                                                <option value="income">Income</option>
                                                <option value="investment">Investment</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-sm text-cyan-300 font-semibold">Amount</label>
                                            <input
                                                required
                                                type="number"
                                                step="0.01"
                                                value={form.rupees}
                                                onChange={(e) => setForm({ ...form, rupees: e.target.value })}
                                                className="w-full mt-2 p-3 bg-slate-800/50 text-gray-100 rounded-lg border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 placeholder:text-slate-500 transition-all duration-200 backdrop-blur-sm"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-sm text-cyan-300 font-semibold">Currency</label>
                                            <select
                                                value={form.currency}
                                                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                                                className="w-full mt-2 p-3 bg-slate-800/50 text-gray-100 rounded-lg border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all duration-200 backdrop-blur-sm cursor-pointer"
                                            >
                                                <option value="INR">INR</option>
                                                <option value="UPI">UPI</option>
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="text-sm text-cyan-300 font-semibold">Description</label>
                                            <textarea
                                                value={form.description}
                                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                                className="w-full mt-2 p-3 bg-slate-800/50 text-gray-100 rounded-lg border border-cyan-500/30 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 placeholder:text-slate-500 transition-all duration-200 resize-none backdrop-blur-sm"
                                                rows={3}
                                                placeholder="Optional details"
                                            />
                                        </div>
                                    </div>

                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-5 py-2 bg-slate-700/50 border border-slate-600/50 text-sm rounded-lg hover:bg-slate-700 text-gray-200 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/40 font-medium transition-all duration-200">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}