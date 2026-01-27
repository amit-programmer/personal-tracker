import React, { useState } from "react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("https://personal-tracker-x4kn.onrender.com/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data?.error || data?.message || "Login failed");
                setLoading(false);
                return;
            }
            // Store token in sessionStorage
            if (data?.token) sessionStorage.setItem("token", data.token);
            // Store user info in localStorage
            if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("userId", data.user.id);
            // redirect to app root
            window.location.href = "/";
        } catch (err) {
            setError("Network error");
            console.log("login error = ", err)
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-900 via-slate-900 to-black text-slate-100">
            <div className="w-full max-w-md p-8 rounded-2xl bg-black/50 backdrop-blur-md ring-1 ring-white/6 shadow-lg">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
                    <p className="text-sm text-slate-400 mt-1">Sign in to your personal tracker</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label className="absolute -top-3 left-3 text-xs bg-black/50 px-2 rounded text-slate-300">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full py-3 px-4 rounded-xl bg-slate-800/70 border border-white/6 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="relative">
                        <label className="absolute z-[10] -top-3 left-3 text-xs bg-black/50 px-2 rounded text-slate-300">
                            Password
                        </label>
                        <div className="relative w-full">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full py-3 px-4 pr-12 rounded-xl bg-slate-800/70 border border-white/6 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="••••••••"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                title={showPassword ? "Hide password" : "Show password"}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full  border border-white/6 text-slate-300 hover:bg-slate-700 transition-transform ${showPassword ? 'rotate-12 scale-105' : 'rotate-0'}`}
                            >
                                {/* Eye icon (open/closed) inside input */}
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.94 10.94a3 3 0 104.12 4.12" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.88 15.88C13.94 17.22 11.53 18 8.99 18 5.46 18 2.73 15.64 1 12c.98-1.86 3.04-4.5 6.62-6.22" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.03 12.12C3.59 8.42 6.8 5 12 5c5.2 0 8.41 3.42 9.97 7.12a1 1 0 010 .76C20.41 17.58 17.2 21 12 21c-5.2 0-8.41-3.42-9.97-7.12a1 1 0 010-.76z" />
                                        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                            </button>
                        </div>
                    </div>

                    {error && <div className="text-sm text-rose-400">{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-medium shadow-md disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>

                    <div className="text-center text-xs text-slate-500">
                        <span>Don't have an account? </span>
                        <a href="/signup" className="text-indigo-400 hover:underline">Create one</a>
                    </div>
                </form>

                <div className="mt-6 text-center text-[10px] text-slate-500">
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