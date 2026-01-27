import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Download, RefreshCw } from "lucide-react";
import axios from "axios";
import Nav from "./Nav";

// Ensure axios sends cookies (auth token) to the backend for protected routes
axios.defaults.withCredentials = true;

const Sleep = () => {
  const [sleepRecords, setSleepRecords] = useState([]);
  const [loading, setLoading] = useState(false);
const [startDate, setStartDate] = useState(
  new Date().toISOString().slice(0, 10)
);

  const [endDate, setEndDate] = useState(getTomorrowDate());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    duration: "",
    quality: "Good",
    notes: "",
  });

  function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}


  const API_BASE = "http://localhost:3000/api/sleep";

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE}?start=${startDate}&end=${endDate}`
      );
      // backend returns { ok: true, data: [...] } — normalize to array
      let items = [];
      if (Array.isArray(response.data)) items = response.data;
      else if (response.data && Array.isArray(response.data.data))
        items = response.data.data;
      setSleepRecords(items);
    } catch (error) {
      console.error("Error fetching records:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Normalize payload to match backend validator expectations
      const payload = {
        ...formData,
        // ensure duration is a number
        duration: Number(formData.duration),
        // backend accepts lowercase quality values
        quality: formData.quality
          ? String(formData.quality).toLowerCase()
          : undefined,
      };

      if (Number.isNaN(payload.duration) || payload.duration < 0) {
        alert("Please enter a valid non-negative duration (hours).");
        return;
      }

      if (editingId) {
        await axios.patch(`${API_BASE}/${editingId}`, payload);
      } else {
        await axios.post(API_BASE, payload);
      }
      setFormData({
        date: new Date().toISOString().split("T")[0],
        duration: "",
        quality: "Good",
        notes: "",
      });
      setEditingId(null);
      setShowForm(false);
      fetchRecords();
    } catch (error) {
      // Show server-side validation errors when available
      if (error.response && error.response.data) {
        console.error("Error saving record:", error.response.data);
        const serverMsg =
          error.response.data.error ||
          (error.response.data.errors &&
            error.response.data.errors.map((e) => e.msg).join(", "));
        alert(`Save failed: ${serverMsg || "Unknown server error"}`);
      } else {
        console.error("Error saving record:", error);
        alert("Save failed: network or unexpected error");
      }
    }
  };

  const handleEdit = (record) => {
    setFormData(record);
    setEditingId(record._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this record?")) {
      try {
        await axios.delete(`${API_BASE}/${id}`);
        fetchRecords();
      } catch (error) {
        console.error("Error deleting record:", error);
      }
    }
  };

  const handleExport = async () => {
    window.open(
      `${API_BASE}/export?start=${startDate}&end=${endDate}&download=1`
    );
  };

  // Ensure we always work with an array of records
  const recordsArray = Array.isArray(sleepRecords) ? sleepRecords : [];

  const avgDuration =
    recordsArray.length > 0
      ? (
          recordsArray.reduce((sum, r) => sum + (Number(r.duration) || 0), 0) /
          recordsArray.length
        ).toFixed(1)
      : 0;

  const totalHours = recordsArray.reduce(
    (sum, r) => sum + (Number(r.duration) || 0),
    0
  );

  return (
    <div className="sleep-root min-h-screen bg-gradient-to-br from-blue-950 via-gray-900 to-purple-950 ">
      <Nav />
      <style>{`
                .sleep-root ::selection { background: #15151576; color: #14e9c2; }
                .sleep-root ::-moz-selection { background: #101010; color: #9c39b8; }
                .sleep-root ::selection { box-shadow: 0 0 0 6px rgba(14,165,255,0.10); }
            `}</style>
      <div className="max-w-7xl mx-auto px-8 pt-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">
              Sleep Tracker
            </h1>
            <p className="text-slate-400">
              Monitor your sleep patterns and health
            </p>
          </div>

          {/* add new record button  */}
          <div className="relative group inline-block">
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
              }}
              className="flex items-center gap-2
               bg-gradient-to-r from-green-600 to-green-700
               hover:from-green-500 hover:to-green-600
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
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm">Total Hours</p>
            <p className="text-3xl font-bold text-cyan-400">{totalHours}h</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm">Average Duration</p>
            <p className="text-3xl font-bold text-cyan-400">{avgDuration}h</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm">Records</p>
            <p className="text-3xl font-bold text-cyan-400">
              {sleepRecords.length}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <div className="w-full sm:w-auto">
              <label className="text-slate-400 text-sm block mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded w-full sm:w-auto"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-slate-400 text-sm block mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded w-full sm:w-auto"
              />
            </div>
            <div className="flex gap-2 items-end w-full sm:w-auto">
              {/* refresh button */}

              <div className="relative group inline-block">
                <button
                  onClick={fetchRecords}
                  className="flex items-center gap-2
               bg-gradient-to-r from-blue-600 to-blue-600
               hover:from-blue-500 hover:to-blue-500
               px-4 py-2 rounded-lg transition font-semibold shadow-lg text-white"
                >
                  <RefreshCw size={18} />
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

              {/* export button */}
              <div className="relative group inline-block">
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2
               bg-gradient-to-r from-purple-600 to-purple-600
               hover:from-purple-500 hover:to-purple-500
               px-4 py-2 rounded-lg transition font-semibold shadow-lg"
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
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded w-full"
                  required
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Duration (hours)"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: parseFloat(e.target.value),
                    })
                  }
                  className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  value={formData.quality}
                  onChange={(e) =>
                    setFormData({ ...formData, quality: e.target.value })
                  }
                  className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded w-full"
                >
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Poor</option>
                </select>
                <input
                  type="text"
                  placeholder="Notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded w-full"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded transition w-full sm:w-auto text-center"
                >
                  {editingId ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded transition w-full sm:w-auto text-center"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Cards List */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-slate-400 text-center py-8">Loading...</p>
          ) : recordsArray.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No records found</p>
          ) : (
            recordsArray.map((record) => (
              <div
                key={record._id}
                className="rounded-xl p-6 border border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 hover:border-cyan-400/40 transition shadow-lg"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">
                      {record.date}
                    </h3>
                    {record.notes && (
                      <p className="text-slate-300 mt-2 italic">
                        {record.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-3xl font-extrabold text-cyan-400">
                      {record.duration}h
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
};

export default Sleep;
