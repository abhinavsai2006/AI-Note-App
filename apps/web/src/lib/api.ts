// API configuration with fallback for development
// In production, NEXT_PUBLIC_API_URL must be set to the backend URL.
const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");
const getApiBase = () => {
  // Use local proxy in production to bypass CORS
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return "/api/proxy";
  }
  return rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;
};
export const API_BASE = getApiBase();

export function stripHtmlTags(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export function getPreviewText(content: string, maxLength: number = 150): string {
  const plainText = stripHtmlTags(content);
  if (!plainText) return "No content yet.";
  return plainText.length > maxLength ? `${plainText.slice(0, maxLength)}...` : plainText;
}

export type Note = {
  id: string;
  title: string;
  content: string;
  tags: { id: string; name: string }[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
};

export type CreateNoteDto = {
  title: string;
  content: string;
  tags?: string[];
  userEmail?: string;
  userName?: string;
};

export type SearchParams = {
  search?: string;
  tag?: string;
  sort?: "recent" | "oldest";
  archive?: boolean;
};

async function requestJson(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    // Properly handle AbortError from timeout
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function signup(email: string, password: string, name: string) {
  return requestJson(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(email: string, password: string) {
  return requestJson(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshAccessToken(refreshToken: string) {
  return requestJson(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
}

export async function logout() {
  return requestJson(`${API_BASE}/auth/logout`, {
    method: "POST",
  });
}

export async function changePassword(token: string, oldPassword: string, newPassword: string) {
  return requestJson(`${API_BASE}/auth/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export async function getCurrentUser(token: string) {
  return requestJson(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getNotes(token?: string, params: SearchParams = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.tag) query.set("tag", params.tag);
  if (params.sort) query.set("sort", params.sort);
  if (params.archive !== undefined) query.set("archive", String(params.archive));

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  return requestJson(`${API_BASE}/notes?${query}`, {
    headers,
  });
}

export async function getNote(token: string | undefined, id: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return requestJson(`${API_BASE}/notes/${id}`, { headers });
}

export async function createNote(token: string | undefined, data: CreateNoteDto) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return requestJson(`${API_BASE}/notes`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
}

export async function updateNote(
  token: string | undefined,
  id: string,
  data: Partial<CreateNoteDto> & { isArchived?: boolean; isPublic?: boolean }
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return requestJson(`${API_BASE}/notes/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
}

export async function deleteNote(token: string | undefined, id: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return requestJson(`${API_BASE}/notes/${id}`, {
    method: "DELETE",
    headers,
  });
}

export async function archiveNote(token: string | undefined, id: string) {
  return updateNote(token, id, { isArchived: true });
}

export async function restoreNote(token: string | undefined, id: string) {
  return updateNote(token, id, { isArchived: false });
}

export async function getTags(token: string) {
  return requestJson(`${API_BASE}/tags`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createTag(token: string, name: string, color: string) {
  return requestJson(`${API_BASE}/tags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, color }),
  });
}

export async function generateAISummary(token: string, noteId: string) {
  return requestJson(`${API_BASE}/notes/${noteId}/generate-summary`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function callAI(prompt: string, token?: string) {
  return requestJson(`${API_BASE}/ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt }),
  });
}

export async function shareNote(token: string, noteId: string) {
  return requestJson(`${API_BASE}/notes/${noteId}/share`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getSharedNote(shareId: string) {
  return requestJson(`${API_BASE}/shared/${shareId}`);
}

export async function getInsightsStats(token: string) {
  return requestJson(`${API_BASE}/insights/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getWeeklyActivity(token: string) {
  return requestJson(`${API_BASE}/insights/weekly-activity`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
