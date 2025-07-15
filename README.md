# mindmapx

This project uses Netlify Functions and a Neon database. SQL migration files are located in the `migrations` folder and serverless functions live in `netlify/functions`.

## Deploying

1. Install dependencies (optional if the build only runs in CI):
   ```bash
   npm install
   ```
2. Run database migrations (requires a configured Neon connection):
   ```bash
   npm run migrate
   ```

Pushing changes to the `main` branch triggers a Netlify production build that deploys the `dist` directory and the functions in `netlify/functions`.
