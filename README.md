# mindmapx

This project uses Netlify Functions and a Neon database. SQL migration files are located in the `migrations` folder and serverless functions live in `netlify/functions`.

## Deploying

1. Install dependencies (optional if the build only runs in CI). Use Node.js 22
   with npm version 10.9.2 or newer:
   ```bash
   npm install
   ```
2. Run database migrations (requires a configured Neon connection):
   ```bash
   npm run migrate
   ```
3. Build the frontend and serverless functions:
   ```bash
   npm run build
   ```
   This command also compiles the TypeScript Netlify functions into
   `dist/netlify/functions`. You can compile just the functions by running
   `npm run build:functions` if you need to verify the output locally.

Pushing changes to the `main` branch triggers a Netlify production build that deploys the `dist` directory and the functions in `dist/netlify/functions`.

## OpenAI Configuration

Set the following variables in your Netlify environment to enable AI powered features:

```
OPENAI_API_KEY=your-openai-key
OPENAI_DEFAULT_MODEL=gpt-4o-mini
```

These are used by serverless functions to generate mind maps and todo lists.
