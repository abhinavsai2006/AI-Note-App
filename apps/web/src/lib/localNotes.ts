import { getSession } from "@/lib/localAuth";
import { createNote, updateNote } from "@/lib/api";

export type LocalTag = {
  id: string;
  name: string;
};

export type LocalNote = {
  id: string;
  title: string;
  content: string;
  isArchived: boolean;
  isPublic: boolean;
  shareId: string | null;
  tags: LocalTag[];
  createdAt: string;
  updatedAt: string;
  summary?: string | null;
  actionItems?: string[];
  suggestedTitle?: string | null;
};

const NOTES_KEY_PREFIX = "noteflow-notes";

function getStorageKey() {
  const session = getSession();
  return `${NOTES_KEY_PREFIX}:${session?.email ?? "guest"}`;
}

function readNotes(): LocalNote[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getStorageKey());
    return raw ? (JSON.parse(raw) as LocalNote[]) : [];
  } catch {
    return [];
  }
}

function writeNotes(notes: LocalNote[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(), JSON.stringify(notes));
}

function buildId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `note-${Date.now()}`;
}

function sortByUpdated(notes: LocalNote[]) {
  return [...notes].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export function getLocalNotes() {
  return sortByUpdated(readNotes());
}

export function getLocalNote(noteId: string) {
  return readNotes().find((note) => note.id === noteId) ?? null;
}

export function createLocalNote(input?: Partial<Pick<LocalNote, "title" | "content" | "tags">>) {
  const now = new Date().toISOString();
  const note: LocalNote = {
    id: buildId(),
    title: input?.title?.trim() || "Untitled Note",
    content: input?.content ?? "",
    isArchived: false,
    isPublic: false,
    shareId: null,
    tags: input?.tags ?? [],
    createdAt: now,
    updatedAt: now,
    summary: null,
    actionItems: [],
    suggestedTitle: null,
  };

  writeNotes([note, ...readNotes()]);
  // Best-effort server sync when a session exists — optimistic create + merge
  try {
    const session = getSession();
    if (session?.email) {
      const token = session.token;
      // call server and then merge returned server note into local storage
      createNote(token, {
        title: note.title,
        content: note.content,
        tags: note.tags.map((t) => t.id),
        userEmail: session.email,
        userName: session.name,
      })
        .then((serverNote: unknown) => {
          const sn = serverNote as unknown as Record<string, unknown>;
          // Replace local note id with server id and update timestamps
          const notes = readNotes();
          const idx = notes.findIndex((n) => n.id === note.id);
          if (idx !== -1) {
            const merged = {
              ...notes[idx],
              id: String(sn['id'] ?? notes[idx].id),
              shareId: String(sn['shareId'] ?? notes[idx].shareId),
              createdAt: String(sn['createdAt'] ?? notes[idx].createdAt),
              updatedAt: String(sn['updatedAt'] ?? notes[idx].updatedAt),
            };
            notes[idx] = merged;
            writeNotes(notes);
          }
        })
        .catch(() => {});
    }
  } catch {}

  return note;
}

export function upsertLocalNote(note: LocalNote) {
  const notes = readNotes();
  const index = notes.findIndex((item) => item.id === note.id);

  if (index === -1) {
    notes.unshift(note);
  } else {
    notes[index] = note;
  }

  writeNotes(notes);
  return note;
}

export function updateLocalNote(noteId: string, patch: Partial<LocalNote>) {
  const existing = getLocalNote(noteId);
  if (!existing) return null;

  const updated: LocalNote = {
    ...existing,
    ...patch,
    tags: patch.tags ?? existing.tags,
    actionItems: patch.actionItems ?? existing.actionItems,
    summary: patch.summary === undefined ? existing.summary : patch.summary,
    suggestedTitle: patch.suggestedTitle === undefined ? existing.suggestedTitle : patch.suggestedTitle,
    updatedAt: new Date().toISOString(),
  };

  upsertLocalNote(updated);

  // Best-effort patch to server when signed in
  try {
    const session = getSession();
    if (session?.email) {
      const token = session.token;
      updateNote(token, noteId, {
        title: updated.title,
        content: updated.content,
        isArchived: updated.isArchived,
        isPublic: updated.isPublic,
      })
        .then((serverNote: unknown) => {
          const sn = serverNote as unknown as Record<string, unknown>;
          // merge server response into local note
          const latest = getLocalNote(noteId);
          if (!latest) return;
          const merged = {
            ...latest,
            updatedAt: String(sn['updatedAt'] ?? latest.updatedAt),
            title: String(sn['title'] ?? latest.title),
            content: String(sn['content'] ?? latest.content),
          };
          upsertLocalNote(merged);
        })
        .catch(() => {});
    }
  } catch {}

  return updated;
}

export function deleteLocalNote(noteId: string) {
  writeNotes(readNotes().filter((note) => note.id !== noteId));
}

export function setNoteArchived(noteId: string, isArchived: boolean) {
  return updateLocalNote(noteId, { isArchived });
}

export function setNotePublic(noteId: string) {
  const existing = getLocalNote(noteId);
  if (!existing) return null;

  const shareId = existing.shareId ?? buildId();
  return updateLocalNote(noteId, { isPublic: true, shareId });
}

export function shareLocalNote(noteId: string) {
  const note = setNotePublic(noteId);
  if (!note) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return {
    note,
    shareUrl: `${origin}/shared/${note.shareId}`,
  };
}

export function getSharedLocalNote(shareId: string) {
  return readNotes().find((note) => note.shareId === shareId && note.isPublic) ?? null;
}