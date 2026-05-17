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

import { signup, login } from "@/lib/api";

export async function createAccount(input: { name: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const res = await signup(email, input.password, input.name);
  const session: StoredSession = {
    token: res.accessToken || res.token || crypto.randomUUID(),
    refreshToken: res.refreshToken,
    email: res.user?.email || email,
    name: res.user?.name || input.name,
    createdAt: new Date().toISOString(),
  };
  writeStorage(SESSION_KEY, session);
  return { account: { name: session.name, email: session.email, passwordHash: '' }, session };
}

export async function signInAccount(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const res = await login(email, input.password);
  const session: StoredSession = {
    token: res.accessToken || res.token || crypto.randomUUID(),
    refreshToken: res.refreshToken,
    email: res.user?.email || email,
    name: res.user?.name || '',
    createdAt: new Date().toISOString(),
  };
  writeStorage(SESSION_KEY, session);

  return { account: { name: session.name, email: session.email, passwordHash: '' }, session };
}
