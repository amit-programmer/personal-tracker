	/* Finance tab: high‑level money snapshot + categories + history */

	import { useState } from 'react'

	const mockDaily = [
	{ date: '01', label: 'Mon', spent: 980, budget: 2000 },
	{ date: '02', label: 'Tue', spent: 1630, budget: 2000 },
	{ date: '03', label: 'Wed', spent: 1420, budget: 2000 },
	{ date: '04', label: 'Thu', spent: 600, budget: 2000 },
	{ date: '05', label: 'Fri', spent: 2100, budget: 2000 },
	{ date: '06', label: 'Sat', spent: 750, budget: 2000 },
	{ date: '07', label: 'Sun', spent: 1200, budget: 2000 }
]

function Finance({ finance }) {
	const percentUsed = Math.round((finance.spent / finance.budget) * 100)
	const [entries, setEntries] = useState([
		{
			id: 1,
			category: 'Food · lunch',
			amount: 220,
			at: '12:42 PM',
			label: '#food',
			source: 'Logged from WhatsApp'
		},
		{
			id: 2,
			category: 'Transport · cab',
			amount: 180,
			at: '09:18 AM',
			label: '#commute',
			source: 'Auto‑parsed from message'
		}
	])
	const [form, setForm] = useState({
		category: '',
		amount: '',
		label: ''
	})

	const handleChange = (field, value) => {
		setForm((prev) => ({ ...prev, [field]: value }))
	}

	const handleAdd = (e) => {
		e.preventDefault()
		if (!form.category || !form.amount) return
		const parsed = Number(form.amount)
		if (Number.isNaN(parsed) || parsed <= 0) return

		setEntries((prev) => [
			{
				id: Date.now(),
				category: form.category,
				amount: parsed,
				at: 'Now',
				label: form.label || '#misc',
				source: 'Manual entry in dashboard'
			},
			...prev
		])
		setForm({ category: '', amount: '', label: '' })
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-[0_0_36px_rgba(0,0,0,0.85)]">
				<div className="flex items-center justify-between text-xs text-zinc-400">
					<h2 className="font-medium text-zinc-100">Finance overview</h2>
					<span className="rounded-full bg-emerald-500/10 px-2 py-[2px] text-[10px] text-emerald-400">
						{percentUsed}% used
					</span>
				</div>
				<p className="mt-1 text-[11px] text-zinc-500">
					Track how today&apos;s spending moves against your daily budget.
				</p>

				<div className="mt-4 flex flex-wrap items-end justify-between gap-4">
					<div>
						<div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
							Spent / budget (₹)
						</div>
						<div className="mt-1 text-2xl font-semibold text-zinc-50">
							₹{finance.spent.toLocaleString()} / ₹{finance.budget.toLocaleString()}
						</div>
						<div className="mt-1 text-[11px] text-zinc-500">
							Remaining today · ₹{(finance.budget - finance.spent).toLocaleString()}
						</div>
					</div>

					<div className="relative h-20 w-full max-w-xs rounded-xl bg-zinc-900/80 p-3">
						<div className="mb-1 flex items-center justify-between text-[11px] text-zinc-400">
							<span>Budget usage</span>
							<span className="text-zinc-300">{percentUsed}%</span>
						</div>
						<div className="h-2 rounded-full bg-zinc-800">
							<div
								className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 shadow-[0_0_20px_rgba(52,211,153,0.8)]"
								style={{ width: `${Math.min(percentUsed, 100)}%` }}
							/>
						</div>
					</div>
				</div>
			</div>

			<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-[0_0_36px_rgba(0,0,0,0.85)]">
				<div className="flex items-center justify-between text-xs text-zinc-400">
					<h3 className="font-medium text-zinc-100">By category</h3>
					<span className="text-[11px] text-zinc-500">Pulls from WhatsApp transactions</span>
				</div>
				<div className="mt-3 space-y-2 text-[11px] text-zinc-300">
					{finance.categories.map((c) => {
						const pct = Math.round((c.value / finance.spent) * 100)
						return (
							<div key={c.name} className="flex items-center gap-3">
								<div className="w-16 text-zinc-400">{c.name}</div>
								<div className="flex-1 rounded-full bg-zinc-900">
									<div
										className="h-1.5 rounded-full bg-zinc-100"
										style={{ width: `${pct}%` }}
									/>
								</div>
								<div className="w-20 text-right text-zinc-300">₹{c.value}</div>
								<div className="w-10 text-right text-zinc-500">{pct}%</div>
							</div>
						)
					})}
				</div>
			</div>

			{/* Daily entries + monthly calendar overview */}
			<div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)]">
				<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-[0_0_32px_rgba(0,0,0,0.9)]">
					<div className="flex items-center justify-between text-xs text-zinc-400">
						<h3 className="font-medium text-zinc-100">Today entries</h3>
						<span className="text-[11px] text-zinc-500">Add + view for today</span>
					</div>
					<form
						onSubmit={handleAdd}
						className="mt-3 grid gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-[11px] text-zinc-300"
					>
						<div className="flex flex-col gap-1">
							<label className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
								Category / note
							</label>
							<input
								type="text"
								value={form.category}
								onChange={(e) => handleChange('category', e.target.value)}
								placeholder="e.g. Food · coffee"
								className="rounded-lg border border-zinc-800 bg-black/40 px-2 py-1 text-[11px] text-zinc-100 outline-none transition focus:border-emerald-500/60 focus:bg-black/60"
							/>
						</div>
						<div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
							<div className="flex flex-col gap-1">
								<label className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
									Amount (₹)
								</label>
								<input
									type="number"
									value={form.amount}
									onChange={(e) => handleChange('amount', e.target.value)}
									placeholder="220"
									className="rounded-lg border border-zinc-800 bg-black/40 px-2 py-1 text-[11px] text-zinc-100 outline-none transition focus:border-emerald-500/60 focus:bg-black/60"
								/>
							</div>
							<div className="flex flex-col gap-1">
								<label className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
									Tag
								</label>
								<input
									type="text"
									value={form.label}
									onChange={(e) => handleChange('label', e.target.value)}
									placeholder="#food, #rent, #gift"
									className="rounded-lg border border-zinc-800 bg-black/40 px-2 py-1 text-[11px] text-zinc-100 outline-none transition focus:border-emerald-500/60 focus:bg-black/60"
								/>
							</div>
						</div>
						<div className="flex justify-end">
							<button
								type="submit"
								className="rounded-lg bg-emerald-500/90 px-3 py-1 text-[11px] font-medium text-black shadow-[0_0_16px_rgba(34,197,94,0.8)] transition hover:bg-emerald-400"
							>
								Add entry
							</button>
						</div>
					</form>
					<div className="mt-3 space-y-2 text-[11px] text-zinc-300">
						{entries.map((entry) => (
							<div
								key={entry.id}
								className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2"
							>
								<div>
									<div className="text-zinc-100">{entry.category}</div>
									<div className="text-[10px] text-zinc-500">
										{entry.source} · {entry.at}
									</div>
								</div>
								<div className="text-right">
									<div className="text-sm font-semibold text-emerald-300">-₹{entry.amount}</div>
									<div className="text-[10px] text-zinc-500">{entry.label}</div>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-[0_0_32px_rgba(0,0,0,0.9)]">
					<div className="flex items-center justify-between text-xs text-zinc-400">
						<h3 className="font-medium text-zinc-100">Monthly view</h3>
						<span className="text-[11px] text-zinc-500">Each day · spent vs budget</span>
					</div>
					<div className="mt-3 grid grid-cols-7 gap-2 text-center text-[10px] text-zinc-500">
						{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => (
							<div key={d}>{d}</div>
						))}
					</div>
					<div className="mt-2 grid grid-cols-7 gap-2 text-[10px]">
						{mockDaily.map((d) => {
							const p = Math.round((d.spent / d.budget) * 100)
							const over = p > 100
							return (
								<div
									key={d.date}
									className="group flex flex-col items-center gap-1 rounded-xl border border-zinc-900 bg-zinc-950/80 p-1.5 hover:border-zinc-700"
								>
									<div className="text-[9px] text-zinc-500">{d.label}</div>
									<div className="text-xs font-medium text-zinc-100">{d.date}</div>
									<div className="h-6 w-full rounded-full bg-zinc-900">
										<div
											className={`h-full rounded-full ${
												over
													? 'bg-gradient-to-r from-amber-400 to-rose-500 shadow-[0_0_10px_rgba(248,113,113,0.8)]'
													: 'bg-gradient-to-r from-emerald-400 to-sky-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
											}`}
											style={{ width: `${Math.min(p, 110)}%` }}
										/>
									</div>
									<div className="mt-0.5 text-[9px] text-zinc-500 group-hover:text-zinc-300">
										₹{d.spent}
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</div>
		</div>
	)
}

export default Finance
