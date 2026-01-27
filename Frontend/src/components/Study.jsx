import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Download, Calendar } from "lucide-react";
import Nav from "./Nav";
import { getAuthToken } from "../middlewares/Auth";

export default function Study() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filters, setFilters] = useState({ 
    subject: "", start: new Date().toISOString().slice(0, 10), end: getTomorrowDate() });
  const [formData, setFormData] = useState({
    subject: "",
    time: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}


  const API_BASE = "https://personal-tracker-x4kn.onrender.com/api/study";

  // Fetch records
  useEffect(() => {
    fetchRecords();
  }, [filters]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.subject) params.append("subject", filters.subject);
      if (filters.start) params.append("start", filters.start);
      if (filters.end) params.append("end", filters.end);

      const token = getAuthToken();
      const authHeader = token
        ? {
            Authorization: token.startsWith("Bearer ")
              ? token
              : `Bearer ${token}`,
          }
        : {};

      const res = await fetch(`${API_BASE}?${params}`, {
        headers: { ...authHeader },
      });
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editId ? "PATCH" : "POST";
      const url = editId ? `${API_BASE}/${editId}` : API_BASE;

      const token = getAuthToken();
      const authHeader = token
        ? {
            Authorization: token.startsWith("Bearer ")
              ? token
              : `Bearer ${token}`,
          }
        : {};

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({
          subject: "",
          time: "",
          date: new Date().toISOString().split("T")[0],
          notes: "",
        });
        setEditId(null);
        setShowForm(false);
        fetchRecords();
      }
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this record?")) {
      try {
        const token = getAuthToken();
        const authHeader = token
          ? {
              Authorization: token.startsWith("Bearer ")
                ? token
                : `Bearer ${token}`,
            }
          : {};
        await fetch(`${API_BASE}/${id}`, {
          method: "DELETE",
          headers: { ...authHeader },
        });
        fetchRecords();
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  const handleEdit = (record) => {
    setFormData(record);
    setEditId(record._id);
    setShowForm(true);
  };

  const handleExport = async () => {
    const params = new URLSearchParams({ download: 1, ...filters });
    window.open(`${API_BASE}/export?${params}`, "_blank");
  };

  // Ensure we always operate on an array. The API may return an object
  // (e.g. { data: [...] }) or other non-array shape which would break
  // `reduce`/`map` calls. Normalize into `list` before using it below.
  const list = Array.isArray(records)
    ? records
    : records && Array.isArray(records.data)
    ? records.data
    : [];

  const totalTime = list.reduce((sum, r) => sum + (Number(r.time) || 0), 0);
  const subjects = [...new Set(list.map((r) => r.subject))];

  return (
    <div className="study-root min-h-screen bg-gradient-to-br from-blue-950 via-gray-900 to-purple-950 text-gray-100    ">
      <style>{`
                .study-root ::selection { background: #1213138a; color: #2ee0a8; }
                .study-root ::-moz-selection { background: #0f0f0f; color: #a82dd4; }
                /* subtle focused-selection shadow for modern look */
                .study-root ::selection { box-shadow: 0 0 0 3px rgba(14,165,255,0.12); }
            `}</style>
      <Nav />
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-10 bg-gradient-to-b from-blue-500 to-purple-500 rounded"></div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent ">
              Study Dashboard
            </h1>
          </div>
          <p className="text-gray-400 text-lg ml-4">
            Track your learning progress with precision
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-blue-500/20 hover:border-blue-500/50 transition shadow-lg hover:shadow-blue-500/20">
            <p className="text-gray-400 text-sm mb-3 font-medium">
              Total Study Time
            </p>
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {totalTime}h
            </p>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/50 transition shadow-lg hover:shadow-purple-500/20">
            <p className="text-gray-400 text-sm mb-3 font-medium">Records</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {list.length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-pink-500/20 hover:border-pink-500/50 transition shadow-lg hover:shadow-pink-500/20">
            <p className="text-gray-400 text-sm mb-3 font-medium">Subjects</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
              {subjects.length}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative group w-fit sm:inline-block">
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditId(null);
                setFormData({
                  subject: "",
                  time: "",
                  date: new Date().toISOString().split("T")[0],
                  notes: "",
                });
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2
                             bg-gradient-to-r from-blue-600 to-blue-700
                             hover:from-blue-500 hover:to-blue-600
                             px-6 py-3 rounded-lg transition font-semibold shadow-lg"
            >
              <Plus size={20} />
              Add Record
            </button>

            {/* Tooltip */}
            <span
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                             whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white
                             opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              Add new record
            </span>
          </div>

          <div className="relative group w-fit sm:inline-block">
            <button
              onClick={handleExport}
              className="w-full sm:w-auto flex items-center justify-center gap-2
                             bg-gradient-to-r from-green-600 to-emerald-600
                             hover:from-green-500 hover:to-emerald-500
                             px-6 py-3 rounded-lg transition font-semibold shadow-lg"
            >
              <Download size={20} />
              Export
            </button>

            {/* Tooltip */}
            <span
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                             whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white
                             opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              Export data
            </span>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 mb-8 border border-blue-500/30 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {editId ? "✏️ Edit Record" : "➕ New Record"}
            </h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4"
            >
              <input
                type="text"
                placeholder="Subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="bg-gray-700/50 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
              <input
                type="number"
                placeholder="Time (hours)"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: parseFloat(e.target.value) })
                }
                className="bg-gray-700/50 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="bg-gray-700/50 rounded-lg px-4 py-3 text-gray-100 border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
              <textarea
                placeholder="Notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="bg-gray-700/50 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition md:col-span-2"
              />
              <div className="flex flex-col sm:flex-row gap-2 md:col-span-2">
                <button
                  type="submit"
                  className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 py-3 rounded-lg transition font-semibold text-center"
                >
                  {editId ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full sm:flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg transition font-semibold text-center"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <input
            type="text"
            placeholder="Filter by subject"
            value={filters.subject}
            onChange={(e) =>
              setFilters({ ...filters, subject: e.target.value })
            }
            className="bg-gray-800/50 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
          />
          <input
            type="date"
            value={filters.start}
            onChange={(e) => setFilters({ ...filters, start: e.target.value })}
            className="bg-gray-800/50 rounded-lg px-4 py-3 text-gray-100 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
          />
          <input
            type="date"
            value={filters.end}
            onChange={(e) => setFilters({ ...filters, end: e.target.value })}
            className="bg-gray-800/50 rounded-lg px-4 py-3 text-gray-100 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
          />
        </div>

        {/* Records */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-400 text-center py-8">⏳ Loading...</p>
          ) : list.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              📚 No records found
            </p>
          ) : (
            list.map((record) => (
              <div
                key={record._id}
                className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 md:p-6 border border-gray-700 hover:border-blue-500/50 transition shadow-sm md:shadow-lg hover:shadow-blue-500/20"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">
                      {record.subject}
                    </h3>
                    <p className="text-gray-400 text-sm flex items-center gap-2 mt-2">
                      <Calendar size={16} />{" "}
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                    {record.notes && (
                      <p className="text-gray-400 text-sm mt-3 italic">
                        {record.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      {record.time}h
                    </p>

                    {/* edit button */}
                    <div className="relative group inline-block">
                      <button
                        onClick={() => handleEdit(record)}
                        className="p-2 bg-gray-400 hover:bg-blue-600 rounded-lg transition shadow-lg"
                      >
                        <Edit2 size={18} />
                      </button>

                      {/* Tooltip */}
                      <span
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
               whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white
               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        Edit record
                      </span>
                    </div>
                    {/* delete button */}
                    <div className="relative group inline-block">
                      <button
                        onClick={() => handleDelete(record._id)}
                        className="p-2 bg-red-900 hover:bg-red-700 rounded-lg transition shadow-lg"
                      >
                        <Trash2 size={18} />
                      </button>

                      {/* Tooltip */}
                      <span
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
               whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white
               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        Delete record
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
