import { createClient } from "@netlify/neon";
let client;
export function getClient() {
  return client ?? (client = createClient(process.env.NETLIFY_DATABASE_URL));
}
