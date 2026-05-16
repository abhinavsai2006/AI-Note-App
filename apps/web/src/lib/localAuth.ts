export type StoredAccount = {
  name: string;
  email: string;
  passwordHash: string;
};

export type StoredSession = {
  token: string;
  email: string;
  name: string;
  createdAt: string;
};

const ACCOUNTS_KEY = "noteflow-accounts";
const SESSION_KEY = "noteflow-session";

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
}

export async function createAccount(input: { name: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
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
