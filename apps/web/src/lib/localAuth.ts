export type StoredAccount = {
  name: string;
  email: string;
  passwordHash: string;
};

export type StoredSession = {
  token: string;
  refreshToken?: string;
  email: string;
  name: string;
  createdAt: string;
};

const ACCOUNTS_KEY = "noteflow-accounts";
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

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(password));
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function getAccounts() {
  return readStorage<StoredAccount[]>(ACCOUNTS_KEY, []);
}

export function getSession() {
  return readStorage<StoredSession | null>(SESSION_KEY, null);
}

export function logoutLocalAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  notifyStorageChange();
}

export function updateStoredAccount(input: { email: string; name?: string }) {
  const email = input.email.trim().toLowerCase();
  const accounts = getAccounts();
  const nextAccounts = accounts.map((account) =>
    account.email === email
      ? {
          ...account,
          name: input.name?.trim() || account.name,
        }
      : account
  );

  writeStorage(ACCOUNTS_KEY, nextAccounts);

  const session = getSession();
  if (session?.email === email && input.name) {
    writeStorage(SESSION_KEY, {
      ...session,
      name: input.name.trim(),
    });
  }
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

  updateStoredAccount({ email: session.email, name: nextName });
}

import { signup, login } from "@/lib/api";

export async function createAccount(input: { name: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase();

  // Try server signup first
  try {
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
  } catch (error) {
    // fallback to local account if server unavailable
    console.warn('Server signup failed, using local fallback:', error);
  }

  const existingAccounts = getAccounts();

  if (existingAccounts.some((account) => account.email === email)) {
    throw new Error("An account with this email already exists.");
  }

  const account: StoredAccount = {
    name: input.name.trim(),
    email,
    passwordHash: await hashPassword(input.password),
  };

  const nextAccounts = [...existingAccounts, account];
  writeStorage(ACCOUNTS_KEY, nextAccounts);

  const session: StoredSession = {
    token: crypto.randomUUID(),
    email: account.email,
    name: account.name,
    createdAt: new Date().toISOString(),
  };
  writeStorage(SESSION_KEY, session);

  return { account, session };
}

export async function signInAccount(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase();

  // Try server login first
  try {
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
  } catch (error) {
    // fallback to local
    console.warn('Server login failed, using local fallback:', error);
  }

  const account = getAccounts().find((item) => item.email === email);

  if (!account) {
    throw new Error("Account not found. Please sign up first.");
  }

  const passwordHash = await hashPassword(input.password);
  if (account.passwordHash !== passwordHash) {
    throw new Error("Incorrect password.");
  }

  const session: StoredSession = {
    token: crypto.randomUUID(),
    email: account.email,
    name: account.name,
    createdAt: new Date().toISOString(),
  };
  writeStorage(SESSION_KEY, session);

  return { account, session };
}
