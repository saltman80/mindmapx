const baseUrl = process.env.API_BASE_URL || 'https://mindxdo.netlify.app';
const email = process.env.EMAIL;
const password = process.env.PASSWORD;

if (!email || !password) {
  console.error('EMAIL and PASSWORD environment variables are required');
  process.exit(1);
}

async function login() {
  const res = await fetch(`${baseUrl}/.netlify/functions/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status}`);
  }
  const data = await res.json();
  return data.token;
}

async function fetchMe(token) {
  const res = await fetch(`${baseUrl}/.netlify/functions/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.status}`);
  }
  return await res.json();
}

(async () => {
  try {
    const token = await login();
    console.log('Logged in');
    const user = await fetchMe(token);
    console.log('User data:', user);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
