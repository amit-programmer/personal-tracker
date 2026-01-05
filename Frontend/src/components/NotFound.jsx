import React, { useEffect, useRef } from "react";
// removed animejs integration — use lightweight CSS + class toggles instead

export default function NotFound() {
    const containerRef = useRef(null);
    const numberRef = useRef(null);
    const subtitleRef = useRef(null);

    const shapes = [
        { left: "8%", top: "18%", size: 64, color: "from-pink-500 to-red-500" },
        { left: "82%", top: "12%", size: 48, color: "from-indigo-400 to-blue-400" },
        { left: "20%", top: "75%", size: 56, color: "from-yellow-400 to-orange-400" },
        { left: "70%", top: "72%", size: 40, color: "from-green-400 to-emerald-400" },
        { left: "50%", top: "40%", size: 28, color: "from-purple-400 to-pink-400" },
    ];

    useEffect(() => {
        if (!containerRef.current) return;

        // simple class toggles to trigger CSS transitions (animejs removed)
        const num = numberRef.current;
        const sub = subtitleRef.current;
        requestAnimationFrame(() => {
            if (num) num.classList.add("nf-appear-num");
            if (sub) sub.classList.add("nf-appear-sub");
        });
    }, []);

    return (
        <div
            ref={containerRef}
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-gray-100 p-6 select-none"
            role="main"
        >
            {/* floating colorful blurred shapes */}
            {shapes.map((s, i) => (
                <span
                    key={i}
                    className={`nf-shape absolute nf-blur rounded-full blur-2xl opacity-80 pointer-events-none`}
                    style={{
                        left: s.left,
                        top: s.top,
                        width: s.size,
                        height: s.size,
                        background: `linear-gradient(135deg, var(--c${i}-a), var(--c${i}-b))`,
                        // fallback color
                        backgroundColor: "rgba(255,255,255,0.03)",
                        mixBlendMode: "screen",
                        transform: "translateZ(0)",
                    }}
                    // set CSS variables so tailwind colors don't need runtime
                    aria-hidden
                />
            ))}

            <div className="relative z-10 max-w-2xl text-center">
                <h1
                    ref={numberRef}
                    className="text-[8rem] md:text-[11rem] font-extrabold leading-none bg-clip-text text-transparent nf-init-num"
                    style={{
                        background:
                            "linear-gradient(90deg, rgba(99,102,241,1) 0%, rgba(236,72,153,1) 45%, rgba(251,191,36,1) 100%)",
                        textShadow: "0 6px 30px rgba(0,0,0,0.6)",
                    }}
                >
                    404
                </h1>

                <p
                    ref={subtitleRef}
                    className="mt-4 text-lg md:text-xl text-gray-300 nf-init-sub"
                >
                    Oops — the page you're looking for can't be found.
                </p>

                <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                        onClick={() => (window.location.href = "/")}
                        className="px-5 py-3 rounded-md bg-white/10 hover:bg-white/20 backdrop-blur text-white transition"
                    >
                        Go Home
                    </button>

                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-3 rounded-md border border-white/10 text-gray-200 hover:border-white/20 transition"
                    >
                        Go Back
                    </button>
                </div>

                <p className="mt-6 text-sm text-gray-500">If you think this is an error, reach out.</p>
            </div>

            {/* inline style tags to assign colors for shape gradients (keeps tailwind-free runtime gradients) */}
            <style>{`
                :root {
                    --c0-a: rgba(236,72,153,0.85);
                    --c0-b: rgba(239,68,68,0.6);
                    --c1-a: rgba(99,102,241,0.8);
                    --c1-b: rgba(59,130,246,0.6);
                    --c2-a: rgba(250,204,21,0.85);
                    --c2-b: rgba(249,115,22,0.6);
                    --c3-a: rgba(52,211,153,0.85);
                    --c3-b: rgba(16,185,129,0.6);
                    --c4-a: rgba(139,92,246,0.8);
                    --c4-b: rgba(236,72,153,0.6);
                }

                /* Fade / pop-in for number */
                .nf-init-num { transform: scale(0.5) rotate(-8deg); opacity: 0; }
                .nf-appear-num { transform: none; opacity: 1; transition: transform 1.2s cubic-bezier(.2,.9,.2,1), opacity 800ms ease; }

                /* Subtitle slide up */
                .nf-init-sub { transform: translateY(24px); opacity: 0; }
                .nf-appear-sub { transform: none; opacity: 1; transition: transform 700ms ease, opacity 700ms ease; }

                /* Floating shapes via CSS keyframes */
                .nf-shape { animation: nf-float 3s ease-in-out infinite alternate; will-change: transform, opacity; }
                @keyframes nf-float {
                  from { transform: translateY(-8px) translateX(-6px) rotate(-6deg); }
                  to   { transform: translateY(8px) translateX(6px) rotate(6deg); }
                }

                /* Gentle pulsing for blurred shapes */
                .nf-blur { animation: nf-pulse 2.2s ease-in-out infinite alternate; }
                @keyframes nf-pulse { from { opacity: 0.45; } to { opacity: 0.9; } }
            `}</style>
        </div>
    );
}