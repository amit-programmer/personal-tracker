Backend Auth Integration

The backend exposes the following auth endpoints under `/api/auth`:

- `POST /api/auth/signup` — body: `{ name, email, password }` (sets auth cookie)
- `POST /api/auth/login` — body: `{ email, password }` (sets auth cookie)
- `GET  /api/auth/me` — returns current user (requires cookie/auth header)
- `POST /api/auth/logout` — clears auth cookie

Use the bundled `src/services/auth.js` client which uses `fetch` with `credentials: 'include'`.

Example:

```js
import auth from './services/auth'

// login
await auth.login({ email: 'a@b.com', password: 'pw' })

// get current user
const me = await auth.me()

// logout
await auth.logout()
```

## Finance API (backend)

All finance routes are protected. Requests must include the auth cookie set by `/api/auth/login` or send an `Authorization: Bearer <token>` header.

Base path: `/api/finance`

- `GET /api/finance` — List finance records. Supports optional query params `?start=YYYY-MM-DD&end=YYYY-MM-DD` to restrict range. Returns `{ ok: true, data: [...] }`.

	Example (fetch with credentials):

	```js
	const res = await fetch('/api/finance?start=2025-01-01&end=2025-12-31', { credentials: 'include' })
	const json = await res.json()
	console.log(json.data)
	```

- `GET /api/finance/:id` — Get a single record by id. Returns `{ ok: true, data: record }`.

	```js
	const r = await fetch(`/api/finance/${id}`, { credentials: 'include' })
	const json = await r.json()
	```

- `POST /api/finance` — Create a new record. Accepts JSON body. Supported fields (best-effort/backwards compatibility):

	- `name` (string)
	- `day` (ISO date string)
	- `type` (string) — e.g. `expenses`, `gain`, `assetsBuy`
	- `rupees` (number) — explicit amount
	- `expense`, `gain`, `assetsBuy` (numbers) — legacy numeric parts; server will compute `rupees` if not provided
	- `currency` (string)
	- `upi` (string)
	- `description` (string)

	Example:

	```js
	await fetch('/api/finance', {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name: 'Coffee', day: '2025-12-28', type: 'expenses', rupees: 120 })
	})
	```

- `PATCH /api/finance/:id` — Update allowed fields: `name`, `day`, `type`, `rupees`, `currency`, `description`. Send only the fields to update.

	```js
	await fetch(`/api/finance/${id}`, {
		method: 'PATCH',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ rupees: 150 })
	})
	```

- `DELETE /api/finance/:id` — Delete a record.

	```js
	await fetch(`/api/finance/${id}`, { method: 'DELETE', credentials: 'include' })
	```

- `GET /api/finance/totals` — Returns totals for a date range. Use same `start`/`end` query params.

	```js
	const res = await fetch('/api/finance/totals?start=2025-01-01&end=2025-12-31', { credentials: 'include' })
	```

- `GET /api/finance/export` — Export records between two dates to a server-generated text file stored under `exports/`. Query params: `start`, `end`. Add `?download=1` to trigger attachment download in browser.

	Example (JSON response with file path):

	```js
	const res = await fetch('/api/finance/export?start=2025-01-01&end=2025-12-31', { credentials: 'include' })
	const j = await res.json()
	// j.file contains exports/<filename>
	```

	Example (trigger browser download):

	```js
	// open in new window/tab with credentials handled by cookie
	window.location.href = '/api/finance/export?start=2025-01-01&end=2025-12-31&download=1'
	```

Responses generally follow `{ ok: true|false, data: ..., error?: 'message' }`.

If you want, I can add a small `Frontend/src/services/finance.js` wrapper similar to `services/auth.js` — would you like that? 


**Food API**
---

Base path: `/api/food`

- `GET /api/food` — List food items. Optional query params: `?category=...&start=YYYY-MM-DD&end=YYYY-MM-DD` (filters `purchaseDate`). Returns `{ ok: true, data: [...] }`.
- `GET /api/food/:id` — Get a single food item by id.
- `POST /api/food` — Create a new food item. JSON body fields:
	- `foodName` (string)
	- `price` (number)
	- `quantity` (number)
	- `category` (string)
	- `unit` (string)
	- `purchaseDate` (ISO date string)
	- `notes` (string)

	Example:

	```js
	await fetch('/api/food', {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ foodName: 'Rice', price: 120, quantity: 1, category: 'Groceries', purchaseDate: '2025-12-28' })
	})
	```

- `PATCH /api/food/:id` — Update fields (same as POST; send only fields to change).
- `DELETE /api/food/:id` — Delete a food item.
- `GET /api/food/export?start=YYYY-MM-DD&end=YYYY-MM-DD` — Export food items in range to a server file. Add `&download=1` to trigger browser download; otherwise response is JSON `{ ok: true, file: 'exports/<file>', count: N }`.

**Study API**
---
Base path: `/api/study`

- `GET /api/study` — List study records. Optional query params: `?subject=...&start=YYYY-MM-DD&end=YYYY-MM-DD` (filters `date`).
- `GET /api/study/:id` — Get single study record.
- `POST /api/study` — Create study record. JSON body fields:
	- `subject` (string)
	- `time` (number) — time studied (e.g., minutes or hours depending on your frontend)
	- `date` (ISO date string)
	- `notes` (string)
- `PATCH /api/study/:id` — Update study record (same fields).
- `DELETE /api/study/:id` — Delete a study record.
- `GET /api/study/export?start=YYYY-MM-DD&end=YYYY-MM-DD&subject=...` — Export study records; add `&download=1` to download file.

**Sleep API**
---
Base path: `/api/sleep`

- `GET /api/sleep` — List sleep records. Optional query: `?start=YYYY-MM-DD&end=YYYY-MM-DD`.
- `GET /api/sleep/:id` — Get single sleep record.
- `POST /api/sleep` — Create sleep record. JSON body fields:
	- `date` (ISO date string) — defaults to now if omitted
	- `duration` (number, required) — hours slept
	- `quality` (string)
	- `notes` (string)

- `PATCH /api/sleep/:id` — Update sleep record (same fields).
- `DELETE /api/sleep/:id` — Delete a sleep record.
- `GET /api/sleep/export?start=YYYY-MM-DD&end=YYYY-MM-DD` — Export sleep records; use `&download=1` to download.

**Target API**
---
Base path: `/api/target`

- `GET /api/target` — List targets. Optional query params: `?start=YYYY-MM-DD&end=YYYY-MM-DD&userId=...`.
- `GET /api/target/:id` — Get single target.
- `POST /api/target` — Create a target. Required fields: `title`, `targetDate`. Other body fields:
	- `description` (string)
	- `isAchieved` (boolean)
	- `achievedAt` (ISO date)
	- `category` (string)
	- `priority` (number)

- `PATCH /api/target/:id` — Update target (same fields).
- `DELETE /api/target/:id` — Delete a target.
- `POST /api/target/:id/mark` — Mark a target as achieved (convenience route `markAsAchieved`).
- `GET /api/target/export?start=YYYY-MM-DD&end=YYYY-MM-DD&userId=...` — Export targets; add `&download=1` to download.

**Other API (Exercise & Habit)**
---
Base path: `/api/other` (sub-resources: `exercises`, `habits`)

Exercise endpoints:
- `GET /api/other/exercises` — List exercises. Optional query: `?start=YYYY-MM-DD&end=YYYY-MM-DD&type=...&done=true|false`.
- `GET /api/other/exercises/:id` — Get exercise by id.
- `POST /api/other/exercises` — Create exercise. Body fields:
	- `name` (string, required)
	- `type` (string)
	- `intensity` (string/number)
	- `done` (boolean)
	- `date` (ISO date)
	- `notes` (string)
- `PATCH /api/other/exercises/:id` — Update exercise (same fields).
- `DELETE /api/other/exercises/:id` — Delete exercise.
- `POST /api/other/exercises/:id/toggle` — Toggle `done` state (convenience).
- `GET /api/other/exercises/export?start=YYYY-MM-DD&end=YYYY-MM-DD` — Export exercises; use `&download=1` to download.

Habit endpoints:
- `GET /api/other/habits` — List habits. Optional query: `?category=...&frequency=...&done=true|false`.
- `GET /api/other/habits/:id` — Get habit by id.
- `POST /api/other/habits` — Create habit. Body fields:
	- `name` (string, required)
	- `category` (string)
	- `frequency` (string)
	- `targetCount` (number)
	- `currentStreak` (number)
	- `longestStreak` (number)
	- `done` (boolean)
	- `reminder` (string)
- `PATCH /api/other/habits/:id` — Update habit (same fields).
- `DELETE /api/other/habits/:id` — Delete habit.
- `POST /api/other/habits/:id/toggle` — Toggle `done`.
- `POST /api/other/habits/:id/completed-date` — Add a completed date (body: `{ date: 'YYYY-MM-DD' }`).
- `GET /api/other/habits/export?start=YYYY-MM-DD&end=YYYY-MM-DD` — Export habits; add `&download=1` to download.

---
Responses across these routes follow the `{ ok: true|false, data: ..., error?: 'message', details?: [...] }` pattern used in the existing APIs.

If you'd like, I can also:
- Add a `Frontend/src/services/` client wrapper for `food`, `study`, `sleep`, `target`, and `other`.
- Create example `curl` snippets for each endpoint.
