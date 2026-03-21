# Local development — frontend & backend

If Safari (or any browser) shows **“Can’t connect to the server”** for `http://localhost:3001/...`, the **Vite dev server is not running**.

## Start the web app (port 3001 by default)

```bash
cd "/path/to/MOxE/FRONTEND"
npm install   # first time only
npm run dev
```

Then open the URL printed in the terminal (often `http://localhost:3001`).

## Start the API (port 5007 by default)

```bash
cd "/path/to/MOxE/BACKEND"
npm install   # first time only
npm run dev
```

The frontend expects `VITE_API_URL` (see `FRONTEND/.env` or defaults) to point at your API, e.g. `http://localhost:5007/api`.

## Nearby messaging & sockets

Nearby posts use **Socket.IO** on the same host as the API (without `/api`). Both servers must be running, and the browser must allow **location** for radius-based delivery after peers have shared GPS.

---

## Production deployment

See **[`MOXE_DEPLOYMENT_GUIDE.md`](./MOXE_DEPLOYMENT_GUIDE.md)** for HTTPS, env vars, `VITE_API_URL`, WebSockets behind Nginx, and hosting options.
