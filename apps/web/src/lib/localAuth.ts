export type StoredSession = {
  token: string;
  refreshToken?: string;
  email: string;
  name: string;
  createdAt: string;
};

const SESSION_KEY = "noteflow-session";

function notifyStorageChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("storage"));
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  notifyStorageChange();
}

export function getSession() {
  return readStorage<StoredSession | null>(SESSION_KEY, null);
}

export function saveSession(session: StoredSession) {
  writeStorage(SESSION_KEY, session);
}

export function logoutLocalAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  notifyStorageChange();
}

export function updateSessionName(name: string) {
  const session = getSession();
  if (!session) return;

  const nextName = name.trim();
  if (!nextName) return;

  writeStorage(SESSION_KEY, {
    ...session,
    name: nextName,
  });
}
