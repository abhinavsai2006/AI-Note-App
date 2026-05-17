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

    void createNote(session.token, { title: 'Untitled Note', content: '' }).then((note) => {
      router.replace(`/notes/${note.id}`);
    });
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center p-8 text-gray-600">
      Creating a new note...
    </div>
  );
}