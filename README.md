# mindmapx

This project uses Netlify Functions and a Neon database. SQL migration files are located in the `migrations` folder and serverless functions live in `netlify/functions`.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run database migrations (requires a configured Neon connection):
   ```bash
   npm run migrate
   ```
3. Start the dev server with Netlify:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

Netlify will automatically deploy the contents of the `dist` directory and any functions in `netlify/functions`.
