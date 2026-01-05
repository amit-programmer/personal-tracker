import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const apiUrl = "http://localhost:3000/api/auth/signup";
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg(null);
        setLoading(true);
        try {
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || data?.message || "Signup failed");
            setMsg({ type: "success", text: data?.message || "Signed up successfully" });
            // Store user ID in localStorage
            if (data?.user?.id) {
                localStorage.setItem("userId", data.user.id);
                localStorage.setItem("user", JSON.stringify(data.user));
            }
            setForm({ name: "", email: "", password: "" });
            // navigate to app root on successful signup
            navigate('/');
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-slate-900 to-black p-6">
            <div className="w-full max-w-md rounded-2xl border border-gray-800/60 bg-gradient-to-tr from-black/60 to-white/2 p-8 shadow-2xl backdrop-blur-md">
                <div className="text-center mb-6">
                    <h1 className="text-white text-4xl font-bold">Create account</h1>
                    <p className="text-gray-300 mt-2">Sign up to start using your personal tracker</p>
                </div>

                {msg && (
                    <div
                        className={`mb-4 px-4 py-2 rounded-md text-sm ${
                            msg.type === "success" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                        }`}
                    >
                        {msg.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-300 mb-2">Name</label>
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#0f1724] border border-gray-800 text-gray-100 placeholder-gray-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Your name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-2">Email</label>
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#0f1724] border border-gray-800 text-gray-100 placeholder-gray-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm text-gray-300 mb-2">Password</label>
                        <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full bg-[#0f1724] border border-gray-800 text-gray-100 placeholder-gray-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                            placeholder="Enter a strong password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-3 top-9 text-gray-300 p-1"
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.02.146-2.01.424-2.94M3 3l18 18" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg hover:opacity-95 disabled:opacity-60"
                    >
                        {loading ? "Signing up..." : "Sign up"}
                    </button>
                </form>

                <div className="mt-6 text-center text-gray-400 text-sm">
                    Already have an account? <a href="/login" className="text-indigo-400 hover:underline">Sign in</a>
                </div>

                <div className="mt-6 text-center">
                    <div className="mt-2 flex items-center justify-center gap-3">
                        <span className="rounded-full p-[2px] bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 shadow-lg transform transition hover:scale-105 inline-flex">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f1724] text-white font-semibold">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                Amazing Tracker
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}