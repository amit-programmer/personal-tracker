import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Download, Calendar, X } from "lucide-react";
import axios from "axios";
import { getAuthToken } from "../middlewares/Auth";
import Nav from "./Nav";

const Food = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(getTomorrowDate());
  const [categoryFilter, setCategoryFilter] = useState("");
  const [error, setError] = useState("");
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [totals, setTotals] = useState({
    totalPrice: 0,
    totalQuantity: 0,
    totalCalories: 0,
  });

  function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}


  const [formData, setFormData] = useState({
    foodName: "",
    price: "",
    quantity: "",
    category: "Vegetables",
    unit: "kg",
    notes: "",
  });

  const nutritionData = {
    roti: {
      calories_kcal: 100,
      carbs_g: 18,
      protein_g: 3,
      minerals_mg: {
        iron: 1.2,
        magnesium: 22,
        phosphorus: 60,
      },
      important: "Good energy source, made from whole wheat",
    },

    apple: {
      calories_kcal: 80,
      minerals_mg: {
        potassium: 150,
      },
      important: "High fiber, helps digestion",
    },

    guava: {
      calories_kcal: 60,
      minerals_mg: {
        potassium: 230,
        magnesium: 22,
      },
      important: "Very high Vitamin C, boosts immunity",
    },

    carrot: {
      calories_kcal: 30,
      minerals_mg: {
        potassium: 195,
      },
      important: "Rich in Vitamin A, good for eyes",
    },

    vegetable_sabzi: {
      calories_kcal: 120,
      minerals_mg: {
        iron: 1.5,
        potassium: 300,
        magnesium: 25,
      },
      important: "Provides vitamins and minerals (depends on oil)",
    },

    rice: {
      calories_kcal: 200,
      minerals_mg: {
        magnesium: 20,
        phosphorus: 68,
      },
      important: "High carbohydrates, gives quick energy",
    },

    dal: {
      calories_kcal: 180,
      minerals_mg: {
        iron: 3.0,
        potassium: 360,
        zinc: 1.3,
      },
      important: "Good plant-based protein source",
    },

    chicken: {
      calories_kcal: 275,
      minerals_mg: {
        iron: 1.2,
        zinc: 2.4,
        phosphorus: 210,
      },
      important: "High-quality protein for muscle growth",
    },

    oil_or_ghee: {
      calories_kcal: 45,
      minerals_mg: {},
      important: "Healthy fats, but excess causes weight gain",
    },

    milk: {
      calories_kcal: 150,
      minerals_mg: {
        calcium: 300,
        phosphorus: 230,
        potassium: 370,
      },
      important: "Rich in calcium and protein",
    },

    sugar: {
      calories_kcal: 20,
      minerals_mg: {},
      important: "Quick energy but no nutrients",
    },

    banana: {
      calories_kcal: 105,
      minerals_mg: {
        potassium: 420,
        magnesium: 32,
      },
      important: "Good for instant energy and muscle function",
    },

    boiled_egg: {
      calories_kcal: 70,
      minerals_mg: {
        iron: 0.9,
        phosphorus: 95,
        selenium: 15,
      },
      important: "Complete protein with essential nutrients",
    },

    kaju: {
      calories_kcal: 9,
      minerals_mg: {
        magnesium: 13,
        zinc: 0.2,
        iron: 0.3,
      },
      important: "Healthy fats, supports brain and heart",
    },

    kismis: {
      calories_kcal: 2,
      minerals_mg: {
        iron: 0.1,
        potassium: 10,
      },
      important: "Natural sugar, helps with mild iron deficiency",
    },
  };

  // Get calories from nutritionData based on food name
  const getCaloriesFromNutrition = (foodName) => {
    if (!foodName) return 0;
    const key = foodName.toLowerCase().replace(/\s+/g, "_");
    return nutritionData[key]?.calories_kcal || 0;
  };

  // Modern Calendar Picker Component
  function ModernCalendar({ selectedDate, onDateSelect, onClose }) {
    const [currentDate, setCurrentDate] = useState(
      new Date(selectedDate || new Date())
    );
    const [selectedDay, setSelectedDay] = useState(
      selectedDate ? new Date(selectedDate).getDate() : null
    );

    const daysInMonth = (date) =>
      new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) =>
      new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const handleDaySelect = (day) => {
      const newDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const formatted = newDate.toISOString().split("T")[0];
      onDateSelect(formatted);
      onClose();
    };

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);

    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);

    return (
      <div className="absolute top-full mt-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl p-5 border border-emerald-500/20 backdrop-blur-xl min-w-80 z-50">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
              )
            }
            className="w-8 h-8 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
          >
            ◀
          </button>
          <div className="text-emerald-300 font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
              )
            }
            className="w-8 h-8 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
          >
            ▶
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-3">
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center text-xs text-emerald-300/70 font-semibold py-2"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-3">
          {days.map((day, idx) => (
            <button
              key={idx}
              disabled={!day}
              onClick={() => day && handleDaySelect(day)}
              className={`
                                aspect-square rounded-lg text-sm font-medium transition-all
                                ${
                                  !day
                                    ? "bg-transparent"
                                    : day === selectedDay
                                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
                                    : "bg-slate-700/40 text-gray-300 hover:bg-emerald-500/30 hover:text-emerald-200"
                                }
                            `}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => handleDaySelect(new Date().getDate())}
            className="flex-1 py-2 bg-slate-700/40 hover:bg-slate-600/60 text-emerald-300 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-700/40 hover:bg-slate-600/60 text-emerald-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const fetchFoods = async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const headers = {};
      if (token) {
        headers["Authorization"] = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;
      }

      const params = {};
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;

      // console.log('Fetching foods with params:', params);
      // console.log('Headers:', headers);

      const res = await axios.get("http://localhost:3000/api/food", {
        headers,
        params,
      });

      // console.log('API Response:', res.data);

      // Handle different response formats
      let foodData = [];
      if (Array.isArray(res.data)) {
        foodData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        foodData = res.data.data;
      } else if (res.data && Array.isArray(res.data.foods)) {
        foodData = res.data.foods;
      } else if (res.data && typeof res.data === "object") {
        // If it's a single object, wrap it in an array
        foodData = [res.data];
      }

      // console.log('Processed foodData:', foodData);

      // Apply category filter on client side
      if (categoryFilter) {
        foodData = foodData.filter((food) => food.category === categoryFilter);
      }

      setFoods(foodData);

      // Calculate totals
      const totalPrice = foodData.reduce(
        (sum, food) => sum + (Number(food.price) || 0),
        0
      );
      const totalQuantity = foodData.reduce(
        (sum, food) => sum + (Number(food.quantity) || 0),
        0
      );
      const totalCalories = foodData.reduce(
        (sum, food) => sum + (Number(food.calories) || 0),
        0
      );

      setTotals({
        totalPrice: totalPrice.toFixed(2),
        totalQuantity: totalQuantity.toFixed(2),
        totalCalories: Math.round(totalCalories),
      });
    } catch (err) {
      console.error("Error fetching foods:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load food items"
      );
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [startDate, endDate, categoryFilter]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const url = editId
        ? `http://localhost:3000/api/food/${editId}`
        : "http://localhost:3000/api/food";

      const method = editId ? "PATCH" : "POST";
      const token = getAuthToken();
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;
      }

      // Get calories from nutritionData based on food name
      const calories = getCaloriesFromNutrition(formData.foodName);
      const payload = {
        ...formData,
        calories: calories.toString(),
        price: Number(formData.price),
        quantity: Number(formData.quantity),
      };

      const res = await axios({
        method,
        url,
        data: payload,
        headers,
      });

      if (res.status === 200 || res.status === 201) {
        fetchFoods();
        setFormData({
          foodName: "",
          price: "",
          quantity: "",
          category: "Vegetables",
          unit: "kg",
          purchaseDate: new Date().toISOString().split("T")[0],
          notes: "",
        });
        setShowForm(false);
        setEditId(null);
      }
    } catch (err) {
      console.error("Error saving food:", err);
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to save food";
      setError(errorMsg);
    }
  };

  // Delete food
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const token = getAuthToken();
        const headers = {};
        if (token) {
          headers["Authorization"] = token.startsWith("Bearer ")
            ? token
            : `Bearer ${token}`;
        }

        await axios.delete(`http://localhost:3000/api/food/${id}`, {
          headers,
        });
        fetchFoods();
      } catch (err) {
        console.error("Error deleting food:", err);
        const errorMsg =
          err.response?.data?.message || err.message || "Failed to delete food";
        setError(errorMsg);
      }
    }
  };

  // Edit food
  const handleEdit = (food) => {
    setFormData(food);
    setEditId(food._id);
    setShowForm(true);
  };

  // Export foods
  const handleExport = async () => {
    try {
      const token = getAuthToken();
      const headers = {};
      if (token) {
        headers["Authorization"] = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;
      }

      const params = { download: 1 };
      if (startDate) params.start = startDate;
      if (endDate) params.end = endDate;

      const res = await axios.get("http://localhost:3000/api/food/export", {
        headers,
        params,
        responseType: "blob",
      });

      const blob = res.data;
      const contentDisp = res.headers["content-disposition"];
      const filename =
        contentDisp?.split("filename=")?.[1] || "food-export.txt";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename.replace(/['"]/g, "");
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Error exporting:", err);
      const errorMsg =
        err.response?.data?.message || err.message || "Failed to export data";
      setError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-gray-900 to-purple-950 food-root">
      <style>{`
          .food-root ::selection { background: #15151576; color: #14e9c2; }
          .food-root ::-moz-selection { background: #101010; color: #9c39b8; }
          .food-root ::selection { box-shadow: 0 0 0 6px rgba(14,165,255,0.10); }
        `}</style>
      <Nav />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">🍎</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    Food Tracker
                  </h1>
                </div>
                <p className="text-slate-400 text-sm sm:text-base">
                  Manage and track your food inventory with style
                </p>
              </div>
              <div className="hidden lg:block text-right">
                <div className="text-sm text-slate-400 mb-2">Totals</div>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-emerald-400 font-semibold">
                      ₹{totals.totalPrice}
                    </span>
                  </div>
                  <div>
                    <span className="text-cyan-400 font-semibold">
                      {totals.totalQuantity} qty
                    </span>
                  </div>
                  <div>
                    <span className="text-yellow-400 font-semibold">
                      {totals.totalCalories} kcal
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Filters & Actions */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 mb-6 border border-slate-700/50 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <label className="text-xs sm:text-sm font-semibold text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text block mb-2">
                  Start Date
                </label>
                <input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onFocus={() => setShowStartCalendar(true)}
                  className="w-full bg-slate-700/50 text-white px-4 py-2.5 rounded-xl border border-slate-600/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 transition cursor-pointer"
                />
                {showStartCalendar && (
                  <ModernCalendar
                    selectedDate={startDate}
                    onDateSelect={setStartDate}
                    onClose={() => setShowStartCalendar(false)}
                  />
                )}
              </div>
              <div className="relative">
                <label className="text-xs sm:text-sm font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text block mb-2">
                  End Date
                </label>
                <input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onFocus={() => setShowEndCalendar(true)}
                  className="w-full bg-slate-700/50 text-white px-4 py-2.5 rounded-xl border border-slate-600/50 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 transition cursor-pointer"
                />
                {showEndCalendar && (
                  <ModernCalendar
                    selectedDate={endDate}
                    onDateSelect={setEndDate}
                    onClose={() => setShowEndCalendar(false)}
                  />
                )}
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text block mb-2">
                  Category Filter
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-700/50 text-white px-4 py-2.5 rounded-xl border border-slate-600/50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-400/30 transition"
                >
                  <option value="">All Categories</option>
                  <option value="Vegetables">🥦 Vegetables</option>
                  <option value="Fruits">🍎 Fruits</option>
                  <option value="Grains">🌾 Grains</option>
                  <option value="Dairy">🥛 Dairy</option>
                  <option value="Meat">🍗 Meat</option>
                  <option value="Snacks">🍿 Snacks</option>
                  <option value="Beverages">🥤 Beverages</option>
                  <option value="Other">📦 Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text block mb-2">
                  Actions
                </label>
                {/* edit button */}
                <div className="relative group inline-block w-full">
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full flex items-center justify-center gap-2
               bg-gradient-to-r from-emerald-500 to-cyan-500
               hover:from-emerald-600 hover:to-cyan-600
               text-white px-4 py-2.5 rounded-xl
               transition shadow-lg hover:shadow-emerald-500/50"
                  >
                    <Plus size={18} />
                    Add Food
                  </button>

                  {/* Tooltip */}
                  <span
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
               whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white
               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    Add new food
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* export button */}
              <div className="relative group inline-block flex-1">
                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-center gap-2
               bg-gradient-to-r from-blue-500 to-purple-600
               hover:from-blue-600 hover:to-purple-700
               text-white px-4 sm:px-6 py-2.5 rounded-xl
               transition shadow-lg hover:shadow-blue-500/50"
                >
                  <Download size={20} />
                  Export Data
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
              {/* refersh button */}
              <div className="relative group inline-block flex-1">
                <button
                  onClick={fetchFoods}
                  className="w-full flex items-center justify-center gap-2
               bg-gradient-to-r from-purple-500 to-pink-600
               hover:from-purple-600 hover:to-pink-700
               text-white px-4 sm:px-6 py-2.5 rounded-xl
               transition shadow-lg hover:shadow-purple-500/50"
                >
                  🔄 Refresh
                </button>

                {/* Tooltip */}
                <span
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
               whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white
               opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  Refresh list
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="text-rose-300 hover:text-rose-200"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl ring-1 ring-emerald-500/30 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    {editId ? "✏️ Edit Food Item" : "➕ Add New Food"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditId(null);
                      setError("");
                    }}
                    className="text-emerald-400/70 hover:text-emerald-300 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
                >
                  <input
                    type="text"
                    placeholder="Food Name"
                    value={formData.foodName}
                    onChange={(e) =>
                      setFormData({ ...formData, foodName: e.target.value })
                    }
                    required
                    className="bg-slate-700/50 text-white px-4 py-2.5 rounded-xl border border-slate-600/50 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30 transition placeholder-slate-500"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                    step="0.01"
                    className="bg-slate-700/50 text-white px-4 py-2.5 rounded-xl border border-slate-600/50 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 transition placeholder-slate-500"
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                    className="bg-slate-700/50 text-white px-4 py-2.5 rounded-xl border border-slate-600/50 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 transition placeholder-slate-500"
                  />
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="bg-slate-700/50 text-white px-4 py-2.5 rounded-xl border border-slate-600/50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-400/30 transition"
                  >
                    <option value="Vegetables">🥦 Vegetables</option>
                    <option value="Fruits">🍎 Fruits</option>
                    <option value="Grains">🌾 Grains</option>
                    <option value="Dairy">🥛 Dairy</option>
                    <option value="Meat">🍗 Meat</option>
                    <option value="Snacks">🍿 Snacks</option>
                    <option value="Beverages">🥤 Beverages</option>
                    <option value="Other">📦 Other</option>
                  </select>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="bg-slate-700/50 text-white px-4 py-2.5 rounded-xl border border-slate-600/50 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-400/30 transition"
                  >
                    <option value="kg">kg</option>
                    <option value="gm">gm</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="pieces">pieces</option>
                    <option value="packets">packets</option>
                  </select>

                  <div className="sm:col-span-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 px-4 py-3 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
                    <p className="text-slate-300 text-sm font-semibold">
                      🔥 Calories:{" "}
                      <span className="text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text">
                        {getCaloriesFromNutrition(formData.foodName)}
                      </span>{" "}
                      <span className="text-emerald-400">kcal</span>
                    </p>
                  </div>
                  <textarea
                    placeholder="Add notes..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="sm:col-span-2 bg-slate-700/50 text-white px-4 py-2.5 rounded-xl border border-slate-600/50 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-400/30 transition resize-none placeholder-slate-500"
                    rows="3"
                  />
                  <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white py-2.5 rounded-xl transition transform hover:scale-105 active:scale-95 font-semibold shadow-lg hover:shadow-emerald-500/50"
                    >
                      {editId ? "💾 Update Food" : "✨ Add Food"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditId(null);
                        setError("");
                      }}
                      className="flex-1 bg-slate-700/50 hover:bg-slate-700 text-white py-2.5 rounded-xl transition font-semibold border border-slate-600/50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Food List - Card Layout */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">
              📋 Your Items
            </h2>

            <div className="space-y-4">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
                  </div>
                </div>
              ) : foods.length === 0 ? (
                <div className="p-12">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-6xl mb-4">🍽️</p>
                    <p className="text-slate-400 text-lg mb-6">
                      No food items found
                    </p>
                    <div className="relative group inline-block">
                      <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition shadow-lg"
                      >
                        Add your first item
                      </button>
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-black px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Create new item
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                foods.map((food) => (
                  <div
                    key={food._id}
                    className="bg-gradient-to-br from-slate-900/70 to-slate-800/60 rounded-2xl p-6 border border-slate-700/30 shadow-lg flex items-center justify-between"
                  >
                    <div className="flex-1 pr-6">
                      <h3 className="text-lg sm:text-2xl font-bold text-white">
                        {food.foodName}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-slate-400 mt-2">
                        <Calendar size={16} />
                        <span>{(food.purchaseDate || "").slice(0, 10)}</span>
                      </div>
                      <p className="mt-3 text-slate-300 italic max-w-xl">
                        {food.notes || ""}
                      </p>
                    </div>

                    <div className="flex flex-col items-end ml-6">
                      <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400">
                        {food.calories || 0} kcal
                      </div>
                      <div className="flex gap-3 mt-3">
                        {/* edit button */}
                        <div className="relative group inline-block">
                          <button
                            onClick={() => handleEdit(food)}
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
                            onClick={() => handleDelete(food._id)}
                            className="p-2 bg-red-800 hover:bg-red-700 rounded-lg transition shadow-lg"
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

            {error && (
              <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-sm">
                {error}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Food;
