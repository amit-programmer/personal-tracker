/* Study tab: deep work & focus */

function Study({ study }) {
	const target = 5
	const percent = Math.round((study.hours / target) * 100)

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-slate-950 to-violet-950/70 p-4 shadow-[0_0_40px_rgba(15,23,42,1)]">
				<div className="flex items-center justify-between text-xs text-zinc-300">
					<h2 className="font-medium text-zinc-100">Study overview</h2>
					<span className="rounded-full bg-violet-500/20 px-2 py-[2px] text-[10px] text-violet-100">
						Focus {study.focusScore}/100
					</span>
				</div>
				<p className="mt-1 text-[11px] text-zinc-400">
					Track deep work blocks directly from WhatsApp.
				</p>

				<div className="mt-4 grid gap-3 sm:grid-cols-3">
					<div className="rounded-xl bg-black/40 p-3">
						<div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
							Focus time
						</div>
						<div className="mt-1 text-2xl font-semibold text-zinc-50">
							{study.hours.toFixed(2)} h
						</div>
						<div className="mt-1 text-[11px] text-zinc-400">
							{percent}% of {target}h target
						</div>
					</div>
					<div className="rounded-xl bg-black/40 p-3">
						<div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
							Focus score
						</div>
						<div className="mt-1 text-2xl font-semibold text-zinc-50">
							{study.focusScore}
						</div>
						<div className="mt-1 h-1.5 rounded-full bg-zinc-900">
							<div
								className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-500"
								style={{ width: `${Math.min(study.focusScore, 100)}%` }}
							/>
						</div>
					</div>
					<div className="rounded-xl bg-black/40 p-3 text-[11px] text-zinc-300">
						<div className="text-xs font-medium text-zinc-100">Suggested next block</div>
						<p className="mt-1 text-zinc-400">
							50–90m distraction‑free session. DM bot:
						</p>
						<p className="mt-1 text-violet-100">study 75m dsa</p>
					</div>
				</div>
			</div>

			<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-[11px] text-zinc-300 shadow-[0_0_36px_rgba(0,0,0,0.9)]">
				<div className="flex items-center justify-between text-xs text-zinc-400">
					<h3 className="font-medium text-zinc-100">Sample session logs</h3>
					<span className="text-[11px] text-zinc-500">Saves as Notion rows</span>
				</div>
				<div className="mt-3 space-y-2">
					<div className="flex gap-2">
						<span className="rounded-md bg-emerald-500/10 px-1.5 py-[1px] text-[10px] text-emerald-300">
							You
						</span>
						<span>study 90m os</span>
					</div>
					<div className="flex gap-2">
						<span className="rounded-md bg-sky-500/10 px-1.5 py-[1px] text-[10px] text-sky-300">
							Bot
						</span>
						<span>Created session · tag &quot;OS&quot; · duration 1.5h</span>
					</div>
					<div className="flex gap-2">
						<span className="rounded-md bg-emerald-500/10 px-1.5 py-[1px] text-[10px] text-emerald-300">
							You
						</span>
						<span>study 45m revision</span>
					</div>
					<div className="flex gap-2">
						<span className="rounded-md bg-sky-500/10 px-1.5 py-[1px] text-[10px] text-sky-300">
							Bot
						</span>
						<span>Appended to revision database · marks focus streak</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Study
