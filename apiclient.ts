const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  status: number;
  url: string;
  constructor(status: number, message: string, url: string) {
    super(`Request to ${url} failed with status ${status}: ${message}`);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const { headers: customHeaders, ...rest } = options;
  const headers = new Headers(customHeaders);
  if (rest.body != null) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(url, { ...rest, headers });
  let data: any = undefined;
  if (res.status !== 204) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (err) {
        if (!res.ok) {
          throw new ApiError(res.status, res.statusText, url);
        }
        throw new ApiError(res.status, 'Invalid JSON response', url);
      }
    } else {
      try {
        data = await res.text();
      } catch {
        data = undefined;
      }
    }
  }
  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data
        ? (data as any).message
        : res.statusText;
    throw new ApiError(res.status, message, url);
  }
  return data as T;
}

export async function fetchMindmap(mapId: string): Promise<Mindmap> {
  const url = `${API_BASE}/mindmaps/${encodeURIComponent(mapId)}`;
  return await request<Mindmap>(url);
}

export async function createNode(data: CreateNodeData): Promise<MindmapNode> {
  const url = `${API_BASE}/nodes`;
  return await request<MindmapNode>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateNode(id: string, data: UpdateNodeData): Promise<MindmapNode> {
  const url = `${API_BASE}/nodes/${encodeURIComponent(id)}`;
  return await request<MindmapNode>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteNode(id: string): Promise<{ success: boolean }> {
  const url = `${API_BASE}/nodes/${encodeURIComponent(id)}`;
  return await request<{ success: boolean }>(url, {
    method: 'DELETE',
  });
}

export async function fetchTodos(nodeId: string): Promise<Todo[]> {
  const url = `${API_BASE}/nodes/${encodeURIComponent(nodeId)}/todos`;
  return await request<Todo[]>(url);
}

export async function createTodo(data: CreateTodoData): Promise<Todo> {
  const url = `${API_BASE}/todos`;
  return await request<Todo>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTodo(id: string, data: UpdateTodoData): Promise<Todo> {
  const url = `${API_BASE}/todos/${encodeURIComponent(id)}`;
  return await request<Todo>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTodo(id: string): Promise<{ success: boolean }> {
  const url = `${API_BASE}/todos/${encodeURIComponent(id)}`;
  return await request<{ success: boolean }>(url, {
    method: 'DELETE',
  });
}

export async function generateTodosAI(prompt: string, nodeId: string): Promise<Todo[]> {
  const url = `${API_BASE}/todos/generate`;
  return await request<Todo[]>(url, {
    method: 'POST',
    body: JSON.stringify({ prompt, nodeId }),
  });
}