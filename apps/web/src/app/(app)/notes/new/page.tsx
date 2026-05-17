"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createNote } from "@/lib/api";
import { getSession } from "@/lib/localAuth";

export default function NewNotePage() {
  const router = useRouter();

  useEffect(() => {
    const session = getSession();
    if (!session?.token) {
      router.replace('/auth/login');
      return;
    }
    (async () => {
      try {
        const note = await createNote(session.token, { title: 'Untitled Note', content: '' });
        if (note?.id) {
          router.replace(`/notes/${note.id}`);
          return;
        }
        // fallback
        router.replace('/notes');
      } catch (err) {
        // Network or API error - log and navigate back to notes list
        // eslint-disable-next-line no-console
        console.error('Failed to create note:', err);
        router.replace('/notes');
      }
    })();
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center p-8 text-gray-600">
      Creating a new note...
    </div>
  );
}