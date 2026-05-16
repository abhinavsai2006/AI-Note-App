const AVATAR_KEY = "noteflow-avatar";

function notifyStorageChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("storage"));
}

export function getStoredAvatar() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(AVATAR_KEY);
  } catch {
    return null;
  }
}

export function setStoredAvatar(value: string | null) {
  if (typeof window === "undefined") return;

  if (!value) {
    window.localStorage.removeItem(AVATAR_KEY);
    notifyStorageChange();
    return;
  }

  window.localStorage.setItem(AVATAR_KEY, value);
  notifyStorageChange();
}
