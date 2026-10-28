# CodeJam Front

React, Vite, TypeScript 7, and Material Design 3 components via `@material/web`. This is a small connection screen until the hackathon project brief defines the product.

Requires Node.js 22.23 or newer (`.nvmrc`).

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env.local` to point the app at another API. Production uses the deployed API URL in `.env.production`. The frontend checks `GET /api/health`; its retry button repeats the same request.

`@material/web` is in maintenance mode; it is used here for the single Material 3 button without introducing another UI framework.

## Cloudflare

The Vite Cloudflare plugin builds the app as a Worker with static assets. `npm run build` typechecks and creates the production build; `npm run deploy` publishes it with `cf deploy`.

### Automatic deploys

Every push to `main` deploys the Worker; you can also run **Deploy Worker** manually from the repository's Actions tab. Add a repository Actions secret named `CLOUDFLARE_API_TOKEN` containing a Cloudflare API token with Workers Scripts Edit permission, scoped to the account in `cloudflare.config.ts`. The workflow runs `npm ci`, `npm run typecheck`, and `npm run build` before deploying that build with `npm run deploy -- --prebuilt`.
