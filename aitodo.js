const { Configuration, OpenAIApi } = require("openai");
const db = require("./neonclient");
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

async function generateTodosAI(prompt) {
  const messages = [
    { role: "system", content: "You generate a JSON array of todos. Each todo has a title and a description." },
    { role: "user", content: `Prompt: "${prompt}". Return only a JSON array of objects like { "title": "...", "description": "..." }.` }
  ];
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 0.7,
    max_tokens: 500
  });
  const content = completion.data.choices[0].message.content.trim();
  let todos;
  try {
    todos = JSON.parse(content);
  } catch {
    const match = content.match(/(\[.*\])/s);
    if (match) todos = JSON.parse(match[1]);
    else throw new Error("Invalid JSON from OpenAI");
  }
  if (!Array.isArray(todos)) throw new Error("OpenAI did not return an array");
  return todos.map(item => ({
    title: item.title ?? "",
    description: item.description ?? ""
  }));
}

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  let body;
  try { body = JSON.parse(event.body); } catch { return { statusCode: 400, body: "Invalid JSON" }; }
  const { prompt, nodeId } = body;
  if (!prompt || typeof prompt !== "string") return { statusCode: 400, body: "Missing or invalid prompt" };
  if (!nodeId || typeof nodeId !== "string") return { statusCode: 400, body: "Missing or invalid nodeId" };
  try {
    const todos = await generateTodosAI(prompt);
    const inserted = [];
    for (const todo of todos) {
      const res = await db.query(
        `INSERT INTO "TodoItem" ("nodeId","title","description","completed","created_at","updated_at")
         VALUES ($1,$2,$3,false,now(),now()) RETURNING *`,
        [nodeId, todo.title, todo.description]
      );
      inserted.push(res.rows[0]);
    }
    return { statusCode: 200, body: JSON.stringify(inserted) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};