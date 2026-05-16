// API configuration with fallback for development
// In production, NEXT_PUBLIC_API_URL should be: https://api-snowy-rho-50.vercel.app
// In development, NEXT_PUBLIC_API_URL should be: http://localhost:3001
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Utility function to strip HTML tags for preview text
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/&lt;/g, "<") // Decode HTML entities
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Utility function to get preview text from content (HTML or plain text)
export function getPreviewText(content: string, maxLength: number = 150): string {
  if (!content) return "No content yet.";
  const plainText = stripHtmlTags(content);
  if (plainText.length > maxLength) {
    return plainText.slice(0, maxLength) + "…";
  }
  return plainText;
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

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

// Auth endpoints
export async function signup(email: string, password: string, name: string) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function logout() {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function changePassword(token: string, oldPassword: string, newPassword: string) {
  const res = await fetch(`${API_BASE}/auth/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCurrentUser(token: string) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
}

// Notes endpoints
export async function getNotes(token?: string, params: SearchParams = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.tag) query.set("tag", params.tag);
  if (params.sort) query.set("sort", params.sort);
  if (params.archive !== undefined) query.set("archive", String(params.archive));

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/notes?${query}`, {
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getNote(token: string | undefined, id: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/notes/${id}`, {
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createNote(token: string | undefined, data: CreateNoteDto) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/notes`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function updateNote(
  token: string | undefined,
  id: string,
  data: Partial<CreateNoteDto> & { isArchived?: boolean; isPublic?: boolean }
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteNote(token: string | undefined, id: string) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function archiveNote(token: string | undefined, id: string) {
  return updateNote(token, id, { isArchived: true });
}

export async function restoreNote(token: string | undefined, id: string) {
  return updateNote(token, id, { isArchived: false });
}

// Tags endpoints
export async function getTags(token: string) {
  const res = await fetch(`${API_BASE}/tags`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createTag(token: string, name: string, color: string) {
  const res = await fetch(`${API_BASE}/tags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, color }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// AI endpoints
export async function generateAISummary(token: string, noteId: string) {
  const res = await fetch(`${API_BASE}/notes/${noteId}/generate-summary`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function callAI(prompt: string, token?: string) {
  const res = await fetch(`${API_BASE}/ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Share endpoints
export async function shareNote(token: string, noteId: string) {
  const res = await fetch(`${API_BASE}/notes/${noteId}/share`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getSharedNote(shareId: string) {
  const res = await fetch(`${API_BASE}/shared/${shareId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createSharedNote(data: { title: string; content: string; author?: string }) {
  const res = await fetch(`${API_BASE}/shared`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Insights endpoints
export async function getInsightsStats(token: string) {
  const res = await fetch(`${API_BASE}/insights/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getWeeklyActivity(token: string) {
  const res = await fetch(`${API_BASE}/insights/weekly-activity`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
