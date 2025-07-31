# mindmapx

This project uses Netlify Functions and a Neon database. SQL migration files are located in the `migrations` folder and serverless functions live in `netlify/functions`.

## Deploying

1. Install dependencies (optional if the build only runs in CI). Use Node.js 22
   with npm version 10.9.2 or newer. The build requires dev dependencies such as
   `vite`, so include them during installation:
   ```bash
   npm install --include=dev
   ```
2. Run database migrations (requires a configured Neon connection). This command
   automatically compiles the migration scripts before executing them:
   ```bash
   npm run migrate
   ```
3. Build the frontend:
```bash
  npm run build
```

If your site is served from a subdirectory (for example
`https://example.com/mindmapx/`), set the `BASE_PATH` environment variable to
that subpath when building. Vite will use this value for asset URLs and the
React router will use it as its basename.

Netlify automatically compiles the TypeScript functions in
`netlify/functions/` during deployment.

Pushing changes to the `main` branch triggers a Netlify production build that deploys the `dist` directory and the functions in `netlify/functions`.

## Auth0 + Stripe Workflow

The purchase flow uses Auth0 for authentication and Stripe Checkout for payment.

1. **Frontend**
   - `src/PurchasePage.tsx` shows a purchase button and calls `createCheckoutSession`.
   - After payment, users land on `set-password.tsx` to create their Auth0 account. The email is looked up from the Stripe session.
2. **Netlify Functions**
   - `createCheckoutSession.ts` creates the Stripe Checkout session.
   - `getCheckoutSession.ts` fetches the Stripe session email after checkout.
   - `handleStripeWebhook.ts` listens for `checkout.session.completed` and records the email.
   - `createAuth0User.ts` creates the Auth0 user once the password is set.
   - `secure-function.ts` demonstrates a protected endpoint using `verifyAuth0Token` from `netlify/lib/auth.ts`.

The flow is: `PurchasePage` → `createCheckoutSession` → Stripe Checkout → `handleStripeWebhook` → `set-password` → `createAuth0User` → protected routes.

Environment variables include `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_AUDIENCE`, `AUTH0_ISSUER`, and `VITE_AUTH0_AUDIENCE`.

## OpenAI Configuration

Set the following variables in your Netlify environment to enable AI powered features:

```
OPENAI_API_KEY=your-openai-key
OPENAI_DEFAULT_MODEL=gpt-4o-mini
```

These are used by serverless functions to generate mind maps and todo lists.

## Kanban Boards Table

If you see errors mentioning `kanban_boards` when starting the API, create the table manually in your Neon database:

```sql
CREATE TABLE IF NOT EXISTS kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION trigger_set_boards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_kanban_boards_updated_at ON kanban_boards;
CREATE TRIGGER set_kanban_boards_updated_at
BEFORE UPDATE ON kanban_boards
FOR EACH ROW EXECUTE PROCEDURE trigger_set_boards_updated_at();

CREATE INDEX IF NOT EXISTS idx_kanban_boards_user_id ON kanban_boards(user_id);
```

## Login Demo

The `scripts/loginAndFetch.js` helper demonstrates how to sign in and fetch
authenticated API endpoints. Provide your credentials via environment variables
and optionally set the base URL of your deployed site:

```bash
EMAIL=you@example.com \
PASSWORD=yourpassword \
API_BASE_URL=https://your-site.netlify.app \
node scripts/loginAndFetch.js
```
