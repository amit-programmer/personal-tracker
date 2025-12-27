/* Food tab: calories, macros and hydration */

function Food({ food }) {
	const calorieTarget = 2200
	const percent = Math.round((food.calories / calorieTarget) * 100)

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-[0_0_36px_rgba(0,0,0,0.85)]">
				<div className="flex items-center justify-between text-xs text-zinc-400">
					<h2 className="font-medium text-zinc-100">Nutrition overview</h2>
					<span className="rounded-full bg-sky-500/10 px-2 py-[2px] text-[10px] text-sky-300">
						{percent}% of {calorieTarget} kcal
					</span>
				</div>
				<p className="mt-1 text-[11px] text-zinc-500">
					Calories + protein from quick WhatsApp messages.
				</p>

				<div className="mt-4 grid gap-3 text-[11px] sm:grid-cols-3">
					<div className="rounded-xl bg-zinc-950/80 p-3">
						<div className="text-zinc-400">Calories</div>
						<div className="mt-1 text-xl font-semibold text-zinc-50">{food.calories}</div>
						<div className="mt-1 h-1.5 rounded-full bg-zinc-900">
							<div
								className="h-1.5 rounded-full bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.8)]"
								style={{ width: `${Math.min(percent, 100)}%` }}
							/>
						</div>
					</div>
					<div className="rounded-xl bg-zinc-950/80 p-3">
						<div className="text-zinc-400">Protein</div>
						<div className="mt-1 text-xl font-semibold text-zinc-50">{food.protein} g</div>
						<div className="mt-1 text-zinc-500">Target · 120 g</div>
					</div>
					<div className="rounded-xl bg-zinc-950/80 p-3">
						<div className="text-zinc-400">Water</div>
						<div className="mt-1 text-xl font-semibold text-zinc-50">{food.water} glasses</div>
						<div className="mt-1 text-zinc-500">Goal · 8 glasses</div>
					</div>
				</div>
			</div>

			<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-[11px] text-zinc-300 shadow-[0_0_36px_rgba(0,0,0,0.85)]">
				<div className="flex items-center justify-between text-xs text-zinc-400">
					<h3 className="font-medium text-zinc-100">Sample commands</h3>
					<span className="text-[11px] text-zinc-500">WhatsApp → tracker</span>
				</div>
				<div className="mt-3 space-y-2 rounded-xl bg-zinc-950/80 p-3">
					<div className="flex gap-2">
						<span className="rounded-md bg-emerald-500/10 px-1.5 py-[1px] text-[10px] text-emerald-300">
							You
						</span>
						<span>food 650kcal 35g protein</span>
					</div>
					<div className="flex gap-2">
						<span className="rounded-md bg-sky-500/10 px-1.5 py-[1px] text-[10px] text-sky-300">
							Bot
						</span>
						<span>Logged lunch · adds to today&apos;s calories + protein</span>
					</div>
					<div className="flex gap-2">
						<span className="rounded-md bg-emerald-500/10 px-1.5 py-[1px] text-[10px] text-emerald-300">
							You
						</span>
						<span>water 2</span>
					</div>
					<div className="flex gap-2">
						<span className="rounded-md bg-sky-500/10 px-1.5 py-[1px] text-[10px] text-sky-300">
							Bot
						</span>
						<span>Updated hydration · +2 glasses</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Food
