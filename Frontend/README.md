# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


## Backend Auth Integration

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
