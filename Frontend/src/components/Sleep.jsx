/* Sleep tab: sleep length + quality */

function Sleep({ sleep }) {
	const target = 8
	const percent = Math.round((sleep.hours / target) * 100)

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-slate-950 to-indigo-950/60 p-4 shadow-[0_0_40px_rgba(15,23,42,0.98)]">
				<div className="flex items-center justify-between text-xs text-zinc-300">
					<h2 className="font-medium text-zinc-100">Sleep overview</h2>
					<span className="rounded-full bg-indigo-500/15 px-2 py-[2px] text-[10px] text-indigo-200">
						{percent}% of {target}h
					</span>
				</div>
				<p className="mt-1 text-[11px] text-zinc-400">
					Log wake / sleep time or total hours via bot.
				</p>

				<div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
					<div>
						<div className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
							Duration
						</div>
						<div className="mt-1 text-3xl font-semibold text-zinc-50">
							{sleep.hours.toFixed(1)} h
						</div>
						<div className="mt-1 text-[11px] text-zinc-400">
							Quality: <span className="text-indigo-200">{sleep.quality}</span>
						</div>

						<div className="mt-3 h-2 rounded-full bg-zinc-900">
							<div
								className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 shadow-[0_0_18px_rgba(129,140,248,0.9)]"
								style={{ width: `${Math.min(percent, 110)}%` }}
							/>
						</div>
					</div>

					<div className="rounded-2xl border border-indigo-500/20 bg-black/40 p-3 text-[11px] text-zinc-200">
						<div className="text-xs font-medium text-zinc-100">Example updates</div>
						<div className="mt-2 space-y-1">
							<div className="flex gap-2">
								<span className="rounded-md bg-emerald-500/10 px-1.5 py-[1px] text-[10px] text-emerald-300">
									You
								</span>
								<span>sleep 7.4h</span>
							</div>
							<div className="flex gap-2">
								<span className="rounded-md bg-sky-500/10 px-1.5 py-[1px] text-[10px] text-sky-300">
									Bot
								</span>
								<span>Logged · Sleep duration for today</span>
							</div>
							<div className="flex gap-2">
								<span className="rounded-md bg-emerald-500/10 px-1.5 py-[1px] text-[10px] text-emerald-300">
									You
								</span>
								<span>sleep quality good</span>
							</div>
							<div className="flex gap-2">
								<span className="rounded-md bg-sky-500/10 px-1.5 py-[1px] text-[10px] text-sky-300">
									Bot
								</span>
								<span>Updated Notion · marks today as &quot;Good&quot;</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Sleep
